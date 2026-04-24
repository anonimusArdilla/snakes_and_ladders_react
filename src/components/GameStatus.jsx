/**
 * GameStatus Component
 *
 * Shows current turn, player positions, and last event.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/gameStore.js';
import { BOARD_SIZE } from '../domain/board.js';

export default function GameStatus() {
  const { t } = useTranslation();
  const playerTile = useGameStore((s) => s.playerTile);
  const aiTile = useGameStore((s) => s.aiTile);
  const currentPlayer = useGameStore((s) => s.currentPlayer);
  const gamePhase = useGameStore((s) => s.gamePhase);
  const lastEvent = useGameStore((s) => s.lastEvent);
  const diceValue = useGameStore((s) => s.diceValue);

  if (gamePhase === 'idle') return null;

  const turnText =
    currentPlayer === 'player' ? t('game.turn.player') : t('game.turn.ai');

  let eventText = null;
  if (lastEvent) {
    if (lastEvent.type === 'snake') eventText = t('event.snake', { tile: lastEvent.tile });
    else if (lastEvent.type === 'ladder') eventText = t('event.ladder', { tile: lastEvent.tile });
    else if (lastEvent.type === 'bounce') eventText = t('event.bounce', { tile: lastEvent.tile });
  }

  return (
    <div className="game-status">
      <div className="status-turn">
        <span className={`turn-indicator ${currentPlayer === 'player' ? 'turn-player' : 'turn-ai'}`}>
          {currentPlayer === 'player' ? '🔵' : '🔴'}
        </span>
        <span>{turnText}</span>
      </div>

      <div className="status-players">
        <div className="status-player">
          <span className="status-icon">🔵</span>
          <span className="status-label">{t('game.player')}</span>
          <span className="status-tile">
            {playerTile} / {BOARD_SIZE}
          </span>
        </div>
        <div className="status-player">
          <span className="status-icon">🔴</span>
          <span className="status-label">{t('game.ai')}</span>
          <span className="status-tile">
            {aiTile} / {BOARD_SIZE}
          </span>
        </div>
      </div>

      {diceValue && !eventText && (
        <div className="status-dice">🎲 {diceValue}</div>
      )}

      {eventText && (
        <div className={`status-event event-${lastEvent.type}`}>
          {eventText}
        </div>
      )}
    </div>
  );
}
