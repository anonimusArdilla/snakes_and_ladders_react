/**
 * useChat Hook
 *
 * Manages chat state and message dispatch via WebSocket injection.
 * Uses useReducer for predictable state transitions.
 */
import { useReducer, useCallback, useEffect, useRef } from 'react';

// ─── Constants ────────────────────────────────────────────────────

export const MAX_MESSAGES = 200;
export const MAX_MESSAGE_LENGTH = 500;
export const SEND_COOLDOWN_MS = 500;

// ─── Types ────────────────────────────────────────────────────────

/**
 * @typedef {Object} ChatMessage
 * @property {string} id — UUID
 * @property {string} roomId
 * @property {string} senderId — 'player1' | 'player2'
 * @property {string} senderName
 * @property {string} text
 * @property {number} timestamp — Date.now()
 */

/**
 * @typedef {Object} ChatState
 * @property {ChatMessage[]} messages — sorted ascending by timestamp
 * @property {number} unreadCount — messages received while chat was collapsed
 * @property {number} lastSendTime — timestamp of last send (for cooldown)
 */

// ─── Actions ──────────────────────────────────────────────────────

/**
 * @typedef {'ADD_MESSAGE'|'SET_SEEN'|'SET_SEND_TIME'|'RESET'} ChatAction
 */

// ─── Reducer ──────────────────────────────────────────────────────

/**
 * @param {ChatState} state
 * @param {{ type: ChatAction, payload?: any }} action
 * @returns {ChatState}
 */
function chatReducer(state, action) {
  switch (action.type) {
    case 'ADD_MESSAGE': {
      const newMsg = action.payload;
      // Deduplicate by id — ignore if already present
      if (state.messages.some((m) => m.id === newMsg.id)) {
        return state;
      }
      const messages = [...state.messages, newMsg].slice(-MAX_MESSAGES);
      return {
        ...state,
        messages,
        unreadCount: state.unreadCount + 1,
      };
    }
    case 'SET_SEEN':
      return { ...state, unreadCount: 0 };
    case 'SET_SEND_TIME':
      return { ...state, lastSendTime: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

const initialState = {
  messages: [],
  unreadCount: 0,
  lastSendTime: 0,
};

// ─── Hook ─────────────────────────────────────────────────────────

/**
 * @param {import('react').MutableRefObject<WebSocket|null>} wsRef — WebSocket ref from useMultiplayer
 * @param {string|null} playerId — local player's id ('player1'|'player2'|null)
 * @param {string|null} roomId — current room id
 * @returns {{
 *   messages: ChatMessage[],
 *   unreadCount: number,
 *   sendMessage: (text: string) => boolean,
 *   markSeen: () => void,
 *   reset: () => void,
 * }}
 */
export function useChat(wsRef, playerId, roomId) {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  // Track whether handler is already attached to avoid duplicates across reconnects
  const attachedRef = useRef(false);

  // Register handler on the WebSocket whenever it becomes available.
  // Depend on playerId so the effect re-runs when the WS connection is established
  // (playerId changes from null → 'player1'/'player2' after room_created/room_joined).
  useEffect(() => {
    const ws = wsRef?.current;
    if (!ws || attachedRef.current) return;

    attachedRef.current = true;

    const handler = (msg) => {
      if (msg.type === 'chat_message') {
        dispatch({ type: 'ADD_MESSAGE', payload: msg });
      }
    };

    // Store handler on the ws object so useMultiplayer's onmessage can call it
    ws._chatHandler = handler;

    return () => {
      attachedRef.current = false;
      ws._chatHandler = null;
    };
  }, [wsRef, playerId]);

  const sendMessage = useCallback(
    (text) => {
      const ws = wsRef?.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return false;
      if (!playerId || !roomId) return false;

      const trimmed = typeof text === 'string' ? text.trim() : '';
      if (!trimmed || trimmed.length > MAX_MESSAGE_LENGTH) return false;

      // Cooldown check
      if (Date.now() - state.lastSendTime < SEND_COOLDOWN_MS) return false;

      ws.send(JSON.stringify({ type: 'chat_message', text: trimmed }));
      dispatch({ type: 'SET_SEND_TIME', payload: Date.now() });
      return true;
    },
    [wsRef, playerId, roomId, state.lastSendTime]
  );

  const markSeen = useCallback(() => {
    dispatch({ type: 'SET_SEEN' });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return {
    messages: state.messages,
    unreadCount: state.unreadCount,
    sendMessage,
    markSeen,
    reset,
  };
}