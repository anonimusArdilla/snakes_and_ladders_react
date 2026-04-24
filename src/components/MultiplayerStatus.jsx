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
  eventLog,
  onLeave,
}) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

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

  return (
    <div className="mp-status">
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
