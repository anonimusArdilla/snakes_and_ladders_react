/**
 * useMultiplayer Hook
 *
 * Manages WebSocket connection, room lifecycle, and state sync.
 * Returns connection state and actions for the UI.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { rollDice as rollDiceLogic } from '../domain/dice.js';

const WS_URL = (() => {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  // In dev, Vite proxies /ws to the game server
  return `${proto}//${window.location.hostname}:3001`;
})();

const RECONNECT_DELAYS = [500, 1000, 2000, 4000, 8000];

export function useMultiplayer() {
  const wsRef = useRef(null);
  const reconnectAttempt = useRef(0);
  const reconnectTimer = useRef(null);

  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  // disconnected → connecting → connected → in_room

  const [roomId, setRoomId] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [players, setPlayers] = useState([]);
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState(null);
  const [eventLog, setEventLog] = useState([]);

  // ─── WebSocket lifecycle ─────────────────────────────────────

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setConnectionStatus('connecting');
    setError(null);

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus('connected');
      reconnectAttempt.current = 0;
    };

    ws.onmessage = (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }

      switch (msg.type) {
        case 'room_created':
          setRoomId(msg.roomId);
          setPlayerId(msg.playerId);
          setPlayers(msg.players);
          setGameState(msg.state);
          setConnectionStatus('in_room');
          setEventLog((prev) => [...prev, { text: `Room created: ${msg.roomId}`, ts: Date.now() }]);
          break;

        case 'room_joined':
          setRoomId(msg.roomId);
          setPlayers(msg.players);
          setGameState(msg.state);
          setConnectionStatus('in_room');
          // Determine our player ID from the players list
          if (!playerId) {
            // We just joined, so we're player2 unless we're the host
            const me = msg.players.find((p) => p.id !== 'player1');
            if (me) setPlayerId(me.id);
          }
          setEventLog((prev) => [...prev, { text: 'Opponent joined!', ts: Date.now() }]);
          break;

        case 'game_state':
          setGameState(msg.state);
          break;

        case 'game_over':
          setGameState(msg.state);
          setEventLog((prev) => [...prev, { text: `Game over! Winner: ${msg.winner}`, ts: Date.now() }]);
          break;

        case 'player_left':
          setGameState(msg.state);
          setEventLog((prev) => [...prev, { text: msg.message || 'Opponent left', ts: Date.now() }]);
          break;

        case 'error':
          setError(msg.message);
          setEventLog((prev) => [...prev, { text: `Error: ${msg.message}`, ts: Date.now() }]);
          break;
      }
    };

    ws.onclose = () => {
      setConnectionStatus('disconnected');
      wsRef.current = null;

      // Auto-reconnect with backoff
      const delay = RECONNECT_DELAYS[Math.min(reconnectAttempt.current, RECONNECT_DELAYS.length - 1)];
      reconnectAttempt.current++;
      reconnectTimer.current = setTimeout(connect, delay);
    };

    ws.onerror = () => {
      // onclose will fire after this
    };
  }, []);

  const disconnect = useCallback(() => {
    clearTimeout(reconnectTimer.current);
    reconnectAttempt.current = 99; // prevent auto-reconnect
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnectionStatus('disconnected');
    setRoomId(null);
    setPlayerId(null);
    setPlayers([]);
    setGameState(null);
    setEventLog([]);
  }, []);

  // ─── Room actions ────────────────────────────────────────────

  const createRoom = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'create_room' }));
    }
  }, []);

  const joinRoom = useCallback((id) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      setError(null);
      wsRef.current.send(JSON.stringify({ type: 'join_room', roomId: id }));
    }
  }, []);

  const leaveRoom = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'leave_room' }));
    }
    setRoomId(null);
    setPlayerId(null);
    setPlayers([]);
    setGameState(null);
    setConnectionStatus('connected');
    setEventLog([]);
  }, []);

  // ─── Game actions ────────────────────────────────────────────

  const rollDice = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'roll_dice' }));
    }
  }, []);

  // ─── Derived state ───────────────────────────────────────────

  const isMyTurn = gameState?.currentPlayer === playerId;
  const amIPlayer1 = playerId === 'player1';
  const opponent = players.find((p) => p.id !== playerId);
  const myTile = amIPlayer1 ? gameState?.player1Tile : gameState?.player2Tile;
  const opponentTile = amIPlayer1 ? gameState?.player2Tile : gameState?.player1Tile;
  const winner = gameState?.winner;
  const gamePhase = gameState?.gamePhase;

  // Shareable link
  const shareUrl = roomId
    ? `${window.location.origin}?room=${roomId}`
    : null;

  // ─── Cleanup on unmount ──────────────────────────────────────

  useEffect(() => {
    return () => {
      clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    // Connection
    connectionStatus,
    connect,
    disconnect,

    // Room
    roomId,
    playerId,
    players,
    createRoom,
    joinRoom,
    leaveRoom,
    shareUrl,

    // Game
    gameState,
    rollDice,
    isMyTurn,
    myTile,
    opponentTile,
    winner,
    gamePhase,

    // UI
    error,
    eventLog,
  };
}
