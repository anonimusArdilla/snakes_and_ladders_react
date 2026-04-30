/**
 * MultiplayerLobby Component
 *
 * Room creation, joining, and waiting screen.
 * Handles the full pre-game flow for online play.
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function MultiplayerLobby({
  connectionStatus,
  connect,
  disconnect,
  createRoom,
  joinRoom,
  leaveRoom,
  roomId,
  players,
  shareUrl,
  error,
  gamePhase,
}) {
  const { t } = useTranslation();
  const [joinInput, setJoinInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState(null); // null | 'create' | 'join'

  // Auto-connect when entering lobby
  useEffect(() => {
    if (connectionStatus === 'disconnected') {
      connect();
    }
  }, [connectionStatus, connect]);

  // Auto-detect room from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlRoom = params.get('room');
    if (urlRoom && connectionStatus === 'connected' && !roomId) {
      setMode('join');
      joinRoom(urlRoom);
    }
  }, [connectionStatus, roomId, joinRoom]);

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: use the modern Clipboard API's writeText or prompt the user
      try {
        const input = document.querySelector('.share-url-input');
        if (input) {
          input.select();
          // Issue 19 fix: use clipboard API instead of deprecated document.execCommand
          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(input.value);
          } else {
            // Last resort: alert the user to copy manually
            alert('Please copy the URL manually: ' + input.value);
          }
        }
      } catch {
        alert('Unable to copy automatically. Please copy the URL manually.');
      }
    }
  };

  const handleJoin = () => {
    const id = joinInput.trim();
    if (id) joinRoom(id);
  };

  // ─── Connecting state ────────────────────────────────────────
  if (connectionStatus === 'disconnected' || connectionStatus === 'connecting') {
    return (
      <div className="lobby">
        <div className="lobby-card">
          <div className="lobby-spinner" />
          <h3 className="lobby-title">Connecting to server…</h3>
          <p className="lobby-sub">Please wait</p>
        </div>
      </div>
    );
  }

  // ─── Waiting for opponent ────────────────────────────────────
  if (roomId && gamePhase === 'waiting') {
    return (
      <div className="lobby">
        <div className="lobby-card lobby-card-waiting">
          <div className="lobby-waiting-icon">⏳</div>
          <h3 className="lobby-title">Waiting for opponent…</h3>
          <p className="lobby-sub">Share this link with a friend to start playing</p>

          <div className="share-url-box">
            <input
              className="share-url-input"
              value={shareUrl || ''}
              readOnly
              onClick={(e) => e.target.select()}
            />
            <button className="btn btn-primary btn-copy" onClick={handleCopyLink}>
              {copied ? '✓ Copied!' : '📋 Copy'}
            </button>
          </div>

          <div className="lobby-room-id">
            Room: <code>{roomId}</code>
          </div>

          <button className="btn btn-secondary" onClick={leaveRoom}>
            ← Back
          </button>
        </div>
      </div>
    );
  }

  // ─── Main lobby menu ─────────────────────────────────────────
  return (
    <div className="lobby">
      <div className="lobby-card">
        <h3 className="lobby-title">🌐 Online Multiplayer</h3>
        <p className="lobby-sub">Play against a real opponent in real-time</p>

        {error && (
          <div className="lobby-error">
            ⚠️ {error}
          </div>
        )}

        {!mode && (
          <div className="lobby-actions">
            <button
              className="btn btn-primary btn-lobby"
              onClick={() => {
                setMode('create');
                createRoom();
              }}
            >
              🎮 Create Room
            </button>
            <button
              className="btn btn-secondary btn-lobby"
              onClick={() => setMode('join')}
            >
              🔗 Join Room
            </button>
          </div>
        )}

        {mode === 'join' && !roomId && (
          <div className="lobby-join">
            <div className="lobby-input-group">
              <input
                className="lobby-input"
                placeholder="Enter room code…"
                value={joinInput}
                onChange={(e) => setJoinInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                autoFocus
              />
              <button
                className="btn btn-primary"
                onClick={handleJoin}
                disabled={!joinInput.trim()}
              >
                Join
              </button>
            </div>
            <button
              className="btn btn-text"
              onClick={() => { setMode(null); setError(null); }}
            >
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
