/**
 * Multiplayer WebSocket Server
 *
 * Manages rooms, validates moves, syncs state between two players.
 * Zero dependencies on game logic — reuses the same domain rules.
 */
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import express from 'express';
import { randomUUID } from 'crypto';
import { rollDice } from '../src/domain/dice.js';
import { resolveTurn, nextTurn } from '../src/domain/rules.js';
import { BOARD_SIZE } from '../src/domain/board.js';

// ─── Room Management ─────────────────────────────────────────────

const rooms = new Map();

function createRoom(hostWs) {
  const roomId = randomUUID().slice(0, 8); // Short, URL-friendly ID
  const room = {
    id: roomId,
    players: [{ ws: hostWs, id: 'player1', name: 'Player 1' }],
    state: {
      player1Tile: 0,
      player2Tile: 0,
      currentPlayer: 'player1',
      gamePhase: 'waiting', // waiting → playing → finished
      winner: null,
      lastEvent: null,
      diceValue: null,
      turnCount: 0,
    },
    createdAt: Date.now(),
  };
  rooms.set(roomId, room);
  return room;
}

function joinRoom(roomId, guestWs) {
  const room = rooms.get(roomId);
  if (!room) return { error: 'Room not found' };
  if (room.players.length >= 2) return { error: 'Room is full' };
  if (room.state.gamePhase !== 'waiting') return { error: 'Game already started' };

  room.players.push({ ws: guestWs, id: 'player2', name: 'Player 2' });
  room.state.gamePhase = 'playing';
  room.state.player1Tile = 1;
  room.state.player2Tile = 1;
  room.state.currentPlayer = 'player1';

  return { room };
}

function removePlayer(ws) {
  for (const [roomId, room] of rooms) {
    const idx = room.players.findIndex((p) => p.ws === ws);
    if (idx === -1) continue;

    room.players.splice(idx, 1);

    if (room.players.length === 0) {
      rooms.delete(roomId);
    } else {
      // Notify remaining player
      room.state.gamePhase = 'finished';
      room.state.winner = room.players[0].id;
      sendToRoom(room, {
        type: 'player_left',
        state: room.state,
        message: 'Opponent disconnected. You win!',
      });
    }
    return;
  }
}

// ─── Networking ──────────────────────────────────────────────────

function send(ws, data) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

function sendToRoom(room, data) {
  for (const player of room.players) {
    send(player.ws, data);
  }
}

function getPlayerInfo(room) {
  return room.players.map((p) => ({ id: p.id, name: p.name }));
}

// ─── Game Logic (server-authoritative) ───────────────────────────

function handleRollDice(ws, room) {
  const player = room.players.find((p) => p.ws === ws);
  if (!player) return;
  if (room.state.currentPlayer !== player.id) return;
  if (room.state.gamePhase !== 'playing') return;

  const dice = rollDice();
  const tileKey = `${player.id}Tile`;
  const currentTile = room.state[tileKey];

  const result = resolveTurn(currentTile, dice);

  // Update state
  room.state[tileKey] = result.finalTile;
  room.state.diceValue = dice;
  room.state.lastEvent = result.interaction
    ? { type: result.interaction.type, tile: result.finalTile }
    : result.bounced
      ? { type: 'bounce', tile: result.finalTile }
      : { type: 'normal', tile: result.finalTile };
  room.state.turnCount++;

  // Check win
  if (result.won) {
    room.state.gamePhase = 'finished';
    room.state.winner = player.id;
    sendToRoom(room, {
      type: 'game_over',
      state: room.state,
      winner: player.id,
    });
    return;
  }

  // Switch turn
  room.state.currentPlayer = nextTurn(room.state.currentPlayer);

  sendToRoom(room, {
    type: 'game_state',
    state: room.state,
  });
}

// ─── Cleanup stale rooms every 5 min ─────────────────────────────

setInterval(() => {
  const now = Date.now();
  for (const [roomId, room] of rooms) {
    if (now - room.createdAt > 30 * 60 * 1000) { // 30 min TTL
      sendToRoom(room, { type: 'error', message: 'Room expired' });
      rooms.delete(roomId);
    }
  }
}, 5 * 60 * 1000);

// ─── HTTP + WebSocket Server ─────────────────────────────────────

const app = express();

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', rooms: rooms.size });
});

// Room info endpoint
app.get('/api/room/:id', (req, res) => {
  const room = rooms.get(req.params.id);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json({
    id: room.id,
    playerCount: room.players.length,
    gamePhase: room.state.gamePhase,
  });
});

const server = createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  let currentRoom = null;

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return send(ws, { type: 'error', message: 'Invalid JSON' });
    }

    switch (msg.type) {
      case 'create_room': {
        const room = createRoom(ws);
        currentRoom = room;
        send(ws, {
          type: 'room_created',
          roomId: room.id,
          playerId: 'player1',
          state: room.state,
          players: getPlayerInfo(room),
        });
        break;
      }

      case 'join_room': {
        const result = joinRoom(msg.roomId, ws);
        if (result.error) {
          send(ws, { type: 'error', message: result.error });
          break;
        }
        currentRoom = result.room;
        // Notify both players
        sendToRoom(currentRoom, {
          type: 'room_joined',
          roomId: currentRoom.id,
          state: currentRoom.state,
          players: getPlayerInfo(currentRoom),
        });
        break;
      }

      case 'roll_dice': {
        if (!currentRoom) {
          send(ws, { type: 'error', message: 'Not in a room' });
          break;
        }
        handleRollDice(ws, currentRoom);
        break;
      }

      case 'leave_room': {
        if (currentRoom) {
          removePlayer(ws);
          currentRoom = null;
        }
        break;
      }

      default:
        send(ws, { type: 'error', message: `Unknown type: ${msg.type}` });
    }
  });

  ws.on('close', () => {
    if (currentRoom) {
      removePlayer(ws);
      currentRoom = null;
    }
  });
});

// ─── Start ───────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[multiplayer] Server running on port ${PORT}`);
  console.log(`[multiplayer] WebSocket: ws://0.0.0.0:${PORT}`);
});
