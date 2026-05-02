/**
 * MessageList — Renders chat messages inside an aria-live region.
 * Accepts messages array and playerId to determine ownership.
 */
import React from 'react';
import MessageBubble from './MessageBubble.jsx';

export default function MessageList({ messages, playerId }) {
  return (
    <div className="msg-list" role="log" aria-live="polite" aria-label="Chat messages">
      {messages.length === 0 && (
        <div className="msg-empty">No messages yet. Say hello!</div>
      )}
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          isOwn={msg.senderId === playerId}
          playerId={playerId}
        />
      ))}
    </div>
  );
}