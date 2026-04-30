/**
 * useMultiplayer Hook
 *
 * Manages WebSocket connection, room lifecycle, and state sync.
 * Returns connection state and actions for the UI.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

// Issue 4 fix: WS_URL configurable via environment variable
const WS_URL = import.meta.env.VITE_WS_URL ||
  (() => {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // In dev, Vite proxies /ws to the game server
    return `${proto}//${window.location.hostname}:3001`;
  })();

// Issue 5 fix: Extract hardcoded timing values
export const RECONNECT_DELAYS = [500, 1000, 2000, 4000, 8000];
export const CONNECTION_TIMEOUT_MS = 10000;
export const HEARTBEAT_INTERVAL_MS = 30000;
export const HEARTBEAT_TIMEOUT_MS = 5000;

export function useMultiplayer() {
  const wsRef = useRef(null);
  const reconnectAttempt = useRef(0);
  const reconnectTimer = useRef(null);
  const shouldReconnect = useRef(true); // Issue 10 fix
  const connectTimeoutRef = useRef(null); // Issue 11 fix
  const heartbeatTimer = useRef(null); // Issue 12 fix
  const heartbeatFailures = useRef(0);
  const playerIdRef = useRef(null); // Issue 3 fix

  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  // disconnected → connecting → connected → in_room

  const [roomId, setRoomId] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [players, setPlayers] = useState([]);
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState(null);
  const [eventLog, setEventLog] = useState([]);

  // Keep ref in sync with state — Issue 3 fix
  playerIdRef.current = playerId;

  // ─── Heartbeat (ping/pong) ─────────────────────────────────────
  const startHeartbeat = useCallback((ws) => {
    const ping = () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
        // If we don't get a pong within HEARTBEAT_TIMEOUT_MS, consider disconnected
        const pongTimeout = setTimeout(() => {
          heartbeatFailures.current++;
          if (heartbeatFailures.current >= 3) {
            // 3 missed pongs = disconnect
            ws.close();
          }
        }, HEARTBEAT_TIMEOUT_MS);

        // Override onpong to clear the timer
        // We'll handle this via the onmessage handler
        ws._pongTimeout = pongTimeout;
      }
    };
    heartbeatTimer.current = setInterval(ping, HEARTBEAT_INTERVAL_MS);
  }, []);

  const stopHeartbeat = useCallback(() => {
    clearInterval(heartbeatTimer.current);
    heartbeatTimer.current = null;
    heartbeatFailures.current = 0;
  }, []);

  // ─── WebSocket lifecycle ─────────────────────────────────────

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setConnectionStatus('connecting');
    setError(null);
    shouldReconnect.current = true; // Issue 10 fix

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    // Issue 11 fix: Connection timeout
    connectTimeoutRef.current = setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN) {
        ws.close();
        setConnectionStatus('disconnected');
        setError('Connection timed out');
        wsRef.current = null;
      }
    }, CONNECTION_TIMEOUT_MS);

    ws.onopen = () => {
      clearTimeout(connectTimeoutRef.current);
      setConnectionStatus('connected');
      reconnectAttempt.current = 0;
      heartbeatFailures.current = 0;
      startHeartbeat(ws);
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
          // Server now provides playerId directly — use it unconditionally
          if (msg.playerId) {
            playerIdRef.current = msg.playerId;
            setPlayerId(msg.playerId);
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

        // Issue 12 fix: Handle pong from server
        case 'pong':
          clearTimeout(ws._pongTimeout);
          heartbeatFailures.current = 0;
          break;
      }
    };

    ws.onclose = () => {
      clearTimeout(connectTimeoutRef.current);
      stopHeartbeat();
      setConnectionStatus('disconnected');
      wsRef.current = null;

      // Issue 10 fix: Use shouldReconnect flag instead of magic number
      if (shouldReconnect.current) {
        const delay = RECONNECT_DELAYS[Math.min(reconnectAttempt.current, RECONNECT_DELAYS.length - 1)];
        reconnectAttempt.current++;
        reconnectTimer.current = setTimeout(connect, delay);
      }
    };

    ws.onerror = () => {
      // onclose will fire after this
    };
  }, [startHeartbeat, stopHeartbeat]);

  const disconnect = useCallback(() => {
    clearTimeout(reconnectTimer.current);
    shouldReconnect.current = false; // Issue 10 fix
    stopHeartbeat();
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
  }, [stopHeartbeat]);

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
      clearTimeout(connectTimeoutRef.current);
      stopHeartbeat();
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [stopHeartbeat]);

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