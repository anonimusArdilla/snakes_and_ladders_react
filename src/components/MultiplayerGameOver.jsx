/**
 * MultiplayerGameOver Component
 *
 * Game result modal for online multiplayer.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { BOARD_SIZE } from '../domain/board.js';

export default function MultiplayerGameOver({
  gameState,
  playerId,
  winner,
  onLeave,
  onPlayAgain,
}) {
  const { t } = useTranslation();

  if (!winner) return null;

  const isWin = winner === playerId;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className={`result-icon ${isWin ? 'result-win' : 'result-lose'}`}>
          {isWin ? '🎉' : '😔'}
        </div>
        <h2 className="result-title">
          {isWin ? 'You Win!' : 'You Lose'}
        </h2>
        <p className="result-subtitle">
          {isWin
            ? 'Congratulations! You reached tile 100 first.'
            : 'Your opponent reached tile 100 first. Better luck next time!'}
        </p>

        <div className="result-stats">
          <div className="stat">
            <span className="stat-value">
              {playerId === 'player1' ? gameState?.player1Tile : gameState?.player2Tile}
            </span>
            <span className="stat-label">Your Tile</span>
          </div>
          <div className="stat">
            <span className="stat-value">
              {playerId === 'player1' ? gameState?.player2Tile : gameState?.player1Tile}
            </span>
            <span className="stat-label">Opponent Tile</span>
          </div>
          <div className="stat">
            <span className="stat-value">{gameState?.turnCount || 0}</span>
            <span className="stat-label">Total Turns</span>
          </div>
        </div>

        <div className="result-actions">
          <button className="btn btn-secondary" onClick={onLeave}>
            ← Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
}
