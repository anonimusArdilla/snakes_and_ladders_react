/**
 * MultiplayerStatus Component
 *
 * In-game HUD for online multiplayer.
 * Shows both players' positions, turn indicator, connection info, and events.
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BOARD_SIZE } from '../domain/board.js';

export default function MultiplayerStatus({
  gameState,
  playerId,
  players,
  isMyTurn,
  myTile,
  opponentTile,
  winner,
  gamePhase,
  shareUrl,
  roomId,
  eventLog,
  onLeave,
}) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [copiedRoom, setCopiedRoom] = useState(false);

  if (!gameState || gamePhase === 'waiting') return null;

  const amIPlayer1 = playerId === 'player1';
  const myName = amIPlayer1 ? 'Player 1 (🔵)' : 'Player 2 (🔴)';
  const oppName = amIPlayer1 ? 'Player 2 (🔴)' : 'Player 1 (🔵)';

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const turnText = isMyTurn
    ? '🎯 Your turn — roll the dice!'
    : "⏳ Opponent's turn…";

  const lastEvent = gameState.lastEvent;
  let eventText = null;
  if (lastEvent) {
    if (lastEvent.type === 'snake') eventText = `🐍 Snake! → tile ${lastEvent.tile}`;
    else if (lastEvent.type === 'ladder') eventText = `🪜 Ladder! → tile ${lastEvent.tile}`;
    else if (lastEvent.type === 'bounce') eventText = `↩️ Bounced back → tile ${lastEvent.tile}`;
  }

  const handleCopyRoomId = async () => {
    if (!roomId) return;
    try {
      await navigator.clipboard.writeText(roomId.toUpperCase());
      setCopiedRoom(true);
      setTimeout(() => setCopiedRoom(false), 2000);
    } catch {}
  };

  return (
    <div className="mp-status">
      {/* Room info — always visible during gameplay */}
      {roomId && (
        <div className="mp-room-info">
          <div className="mp-room-id">
            🏠 Room: <code className="mp-room-code">{roomId}</code>
            <button className="btn btn-text btn-xs" onClick={handleCopyRoomId}>
              {copiedRoom ? '✓' : '📋'}
            </button>
          </div>
          {shareUrl && (
            <div className="mp-share-url-box">
              <input
                className="mp-share-url-input"
                value={shareUrl}
                readOnly
                onClick={(e) => e.target.select()}
              />
              <button className="btn btn-primary btn-xs" onClick={handleCopyLink}>
                {copied ? '✓' : '📋 Copy'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Turn indicator */}
      <div className={`mp-turn ${isMyTurn ? 'mp-turn-mine' : 'mp-turn-opp'}`}>
        <span className="mp-turn-dot" />
        <span>{turnText}</span>
      </div>

      {/* Dice */}
      {gameState.diceValue && (
        <div className="mp-dice">
          🎲 Rolled: <strong>{gameState.diceValue}</strong>
        </div>
      )}

      {/* Event */}
      {eventText && (
        <div className={`mp-event mp-event-${lastEvent.type}`}>
          {eventText}
        </div>
      )}

      {/* Players */}
      <div className="mp-players">
        <div className={`mp-player ${isMyTurn ? 'mp-player-active' : ''}`}>
          <div className="mp-player-header">
            <span className="mp-player-icon">{amIPlayer1 ? '🔵' : '🔴'}</span>
            <span className="mp-player-name">{myName}</span>
            {isMyTurn && <span className="mp-badge">TURN</span>}
          </div>
          <div className="mp-player-tile">
            {myTile || '—'} / {BOARD_SIZE}
          </div>
        </div>

        <div className="mp-vs">VS</div>

        <div className={`mp-player ${!isMyTurn ? 'mp-player-active' : ''}`}>
          <div className="mp-player-header">
            <span className="mp-player-icon">{amIPlayer1 ? '🔴' : '🔵'}</span>
            <span className="mp-player-name">{oppName}</span>
            {!isMyTurn && <span className="mp-badge">TURN</span>}
          </div>
          <div className="mp-player-tile">
            {opponentTile || '—'} / {BOARD_SIZE}
          </div>
        </div>
      </div>

      {/* Share link */}
      {shareUrl && (
        <div className="mp-share">
          <button className="btn btn-text btn-sm" onClick={handleCopyLink}>
            {copied ? '✓ Link copied!' : '📋 Invite link'}
          </button>
        </div>
      )}

      {/* Leave */}
      <button className="btn btn-secondary btn-sm btn-leave" onClick={onLeave}>
        ← Leave
      </button>
    </div>
  );
}
