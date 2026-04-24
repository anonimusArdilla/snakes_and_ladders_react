/**
 * Dice Component
 *
 * Animated dice with face display and roll button.
 * Supports both single-player (from store) and multiplayer (from props).
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/gameStore.js';

const DICE_FACES = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
};

function DiceFace({ value }) {
  if (!value) return <div className="dice-face dice-face-empty">?</div>;
  const dots = DICE_FACES[value] || [];
  return (
    <div className="dice-face">
      {[0, 1, 2].map((row) =>
        [0, 1, 2].map((col) => {
          const active = dots.some(([r, c]) => r === row && c === col);
          return (
            <div
              key={`${row}-${col}`}
              className={`dice-dot ${active ? 'dice-dot-active' : ''}`}
            />
          );
        })
      )}
    </div>
  );
}

export default function Dice({
  isRolling: mpRolling,
  diceValue: mpDiceValue,
  onRoll: mpOnRoll,
  canRoll: mpCanRoll,
  isMultiplayer,
  isAiThinking: mpAiThinking,
} = {}) {
  const { t } = useTranslation();

  // Single-player store values
  const spDiceValue = useGameStore((s) => s.diceValue);
  const spIsRolling = useGameStore((s) => s.isRolling);
  const spIsAiThinking = useGameStore((s) => s.isAiThinking);
  const spCurrentPlayer = useGameStore((s) => s.currentPlayer);
  const spGamePhase = useGameStore((s) => s.gamePhase);
  const spRollDice = useGameStore((s) => s.rollDice);

  // Use multiplayer props or single-player store
  const diceValue = isMultiplayer ? mpDiceValue : spDiceValue;
  const isRolling = isMultiplayer ? mpRolling : spIsRolling;
  const isAiThinking = isMultiplayer ? mpAiThinking : spIsAiThinking;
  const canRoll = isMultiplayer
    ? mpCanRoll
    : spGamePhase === 'playing' && spCurrentPlayer === 'player' && !spIsRolling && !spIsAiThinking;
  const handleRoll = isMultiplayer ? mpOnRoll : spRollDice;

  return (
    <div className="dice-section">
      <div className={`dice ${isRolling ? 'dice-rolling' : ''}`}>
        <DiceFace value={isRolling ? null : diceValue} />
      </div>

      <button
        className="btn btn-primary btn-roll"
        onClick={handleRoll}
        disabled={!canRoll}
      >
        {isRolling
          ? t('game.rolling')
          : isAiThinking
            ? t('game.turn.ai')
            : isMultiplayer
              ? (canRoll ? '🎲 ' + t('action.roll') : "⏳ Opponent's turn")
              : t('action.roll')}
      </button>
    </div>
  );
}
