/**
 * ChatContainer — Wraps chat UI with auto-scroll and connection-aware disabled state.
 * Receives useChat hook return values plus connection info.
 */
import React, { useRef, useEffect, useCallback } from 'react';
import MessageList from './MessageList.jsx';
import ChatInput from './ChatInput.jsx';

export default function ChatContainer({
  messages,
  unreadCount,
  sendMessage,
  markSeen,
  playerId,
  connectionStatus,
  isCollapsed,
  onToggle,
}) {
  const listRef = useRef(null);
  const shouldAutoScroll = useRef(true);

  // Auto-scroll when new messages arrive (only if user is at bottom)
  useEffect(() => {
    if (shouldAutoScroll.current && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    // If user is within 50px of the bottom, keep auto-scrolling
    shouldAutoScroll.current = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
  }, []);

  // Mark messages as seen when chat is opened
  useEffect(() => {
    if (!isCollapsed) {
      markSeen();
    }
  }, [isCollapsed, markSeen]);

  const isConnected = connectionStatus === 'in_room';

  return (
    <div className={`chat-container ${isCollapsed ? 'chat-collapsed' : ''}`}>
      <button
        className="chat-toggle"
        onClick={onToggle}
        aria-label={isCollapsed ? 'Open chat' : 'Close chat'}
      >
        <span>💬 Chat</span>
        {unreadCount > 0 && isCollapsed && (
          <span className="chat-badge">{unreadCount}</span>
        )}
      </button>

      {!isCollapsed && (
        <div className="chat-panel">
          <div className="msg-list-wrapper" ref={listRef} onScroll={handleScroll}>
            <MessageList messages={messages} playerId={playerId} />
          </div>
          <ChatInput
            onSend={sendMessage}
            disabled={!isConnected}
          />
        </div>
      )}
    </div>
  );
}