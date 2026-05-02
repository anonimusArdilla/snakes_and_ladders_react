/**
 * ChatInput — Text input with Enter key to send and debounced typing.
 * Receives onSend callback and disabled flag.
 */
import React, { useState, useRef, useCallback } from 'react';
import { MAX_MESSAGE_LENGTH } from '../../hooks/useChat.js';

export default function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState('');
  const inputRef = useRef(null);

  const handleChange = useCallback((e) => {
    setText(e.target.value);
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    const success = onSend(trimmed);
    if (success) {
      setText('');
      inputRef.current?.focus();
    }
  }, [text, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div className="chat-input-row">
      <input
        ref={inputRef}
        type="text"
        className="chat-input"
        placeholder="Type a message…"
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        maxLength={MAX_MESSAGE_LENGTH}
        aria-label="Chat message input"
      />
      <button
        className="btn btn-primary btn-send"
        onClick={handleSend}
        disabled={disabled || !text.trim()}
        aria-label="Send message"
      >
        Send
      </button>
    </div>
  );
}