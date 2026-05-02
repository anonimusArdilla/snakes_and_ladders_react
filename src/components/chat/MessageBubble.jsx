/**
 * MessageBubble — Single chat message display.
 * Uses React.memo to avoid re-rendering when props haven't changed.
 */
import React from 'react';

const MessageBubble = React.memo(function MessageBubble({ message, isOwn, playerId }) {
  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`msg-bubble ${isOwn ? 'msg-bubble-own' : 'msg-bubble-opp'}`}>
      <div className="msg-bubble-header">
        <span className="msg-sender">
          {isOwn ? 'You' : message.senderName}
        </span>
        <span className="msg-time">{time}</span>
      </div>
      <div className="msg-text">{message.text}</div>
    </div>
  );
});

export default MessageBubble;