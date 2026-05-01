/**
 * GameStatus Component
 *
 * Shows current turn, player positions, and last event.
 * Supports both normal and manual mode.
 * Reads from gameStore (single-player) or receives props.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/gameStore.js';
import { useSettingsStore } from '../store/settingsStore.js';
import { BOARD_SIZE } from '../domain/board.js';

export default function GameStatus({
  manualMode: propManualMode,
  manualAwaitingSelection: propAwaiting,
  manualMistakeCount: propMistakes,
  manualLastPenalty: propPenalty,
} = {}) {
  const { t } = useTranslation();

  // Store values
  const storePlayerTile = useGameStore((s) => s.playerTile);
  const storeAiTile = useGameStore((s) => s.aiTile);
  const storeCurrentPlayer = useGameStore((s) => s.currentPlayer);
  const storeGamePhase = useGameStore((s) => s.gamePhase);
  const storeLastEvent = useGameStore((s) => s.lastEvent);
  const storeDiceValue = useGameStore((s) => s.diceValue);
  const storeManualAwaiting = useGameStore((s) => s.manualAwaitingSelection);
  const storeManualMistakes = useGameStore((s) => s.manualMistakeCount);
  const storeManualPenalty = useGameStore((s) => s.manualLastPenalty);

  const isManualMode = propManualMode !== undefined ? propManualMode : useSettingsStore((s) => s.manualMode);

  // Use props when provided (from App.jsx), fall back to store
  const playerTile = storePlayerTile;
  const aiTile = storeAiTile;
  const currentPlayer = storeCurrentPlayer;
  const gamePhase = storeGamePhase;
  const lastEvent = storeLastEvent;
  const diceValue = storeDiceValue;
  const awaitingSelection = propAwaiting !== undefined ? propAwaiting : storeManualAwaiting;
  const mistakeCount = propMistakes !== undefined ? propMistakes : storeManualMistakes;
  const lastPenalty = propPenalty !== undefined ? propPenalty : storeManualPenalty;

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

      {/* Manual mode indicator */}
      {isManualMode && (
        <div className="status-manual-mode">
          <span className="manual-mode-badge">🖱️ {t('manual.mode')}</span>
          {awaitingSelection && (
            <span className="manual-select-hint">
              👆 {t('manual.selectTileHint')}
            </span>
          )}
        </div>
      )}

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

      {isManualMode && mistakeCount > 0 && (
        <div className="status-mistake-counter">
          ⚠️ {t('manual.mistakes')}: {mistakeCount}
        </div>
      )}

      {isManualMode && lastPenalty && (
        <div className="status-penalty">
          ⚠️ {t(lastPenalty.label)}
        </div>
      )}

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