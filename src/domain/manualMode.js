/**
 * Domain Layer — Manual Mode Rules
 *
 * Pure functions for manual movement logic, validation, and penalties.
 * Completely independent from auto-move rules in rules.js.
 */
import { BOARD_SIZE } from './board.js';

/**
 * Penalty types with escalating severity.
 */
export const PENALTIES = {
  LOSE_TURN: 'loseTurn',
  MOVE_BACK_3: 'moveBack3',
  MOVE_BACK_5: 'moveBack5',
  SKIP_NEXT_ROLL: 'skipNextRoll',
  OPPONENT_FREE_ROLL: 'opponentFreeRoll',
};

/**
 * Penalty labels for UI display.
 * @param {number} mistakeCount
 * @returns {{ type: string, label: string, description: string }}
 */
export function getPenalty(mistakeCount) {
  // Escalating penalties based on consecutive mistakes
  const penalties = [
    {
      type: PENALTIES.LOSE_TURN,
      label: 'manual.penalty.loseTurn',
      description: 'manual.penalty.loseTurn.desc',
    },
    {
      type: PENALTIES.MOVE_BACK_3,
      label: 'manual.penalty.moveBack3',
      description: 'manual.penalty.moveBack3.desc',
    },
    {
      type: PENALTIES.MOVE_BACK_5,
      label: 'manual.penalty.moveBack5',
      description: 'manual.penalty.moveBack5.desc',
    },
    {
      type: PENALTIES.LOSE_TURN,
      label: 'manual.penalty.loseTurn',
      description: 'manual.penalty.loseTurn.desc',
    },
    {
      type: PENALTIES.SKIP_NEXT_ROLL,
      label: 'manual.penalty.skipNextRoll',
      description: 'manual.penalty.skipNextRoll.desc',
    },
  ];

  // Cycle through penalties, wrapping around
  const index = Math.min(mistakeCount, penalties.length - 1);
  return penalties[index];
}

/**
 * Calculate all valid tiles a player can move to after a dice roll.
 * @param {number} currentTile - Player's current position (1-based)
 * @param {number} diceValue - Dice roll value (1-6)
 * @returns {number[]} Array of valid tile numbers the player can select
 */
export function calculateValidMoves(currentTile, diceValue) {
  const targetTile = currentTile + diceValue;
  const validTiles = [];

  // Exact target (if within bounds)
  if (targetTile <= BOARD_SIZE) {
    validTiles.push(targetTile);
    return validTiles;
  }

  // If overshoot: player bounces, so the valid tile is the bounced destination
  const bounced = BOARD_SIZE - (targetTile - BOARD_SIZE);
  if (bounced >= 1 && bounced <= BOARD_SIZE) {
    validTiles.push(bounced);
  }

  return validTiles;
}

/**
 * Validate a player's tile selection.
 * @param {number} selectedTile - The tile the player clicked on
 * @param {number} currentTile - Player's current position
 * @param {number} diceValue - The dice roll value
 * @returns {{ valid: boolean, expectedTile?: number, reason?: string }}
 */
export function validateMove(selectedTile, currentTile, diceValue) {
  const validMoves = calculateValidMoves(currentTile, diceValue);

  // Also accept intermediate tiles along the path (player might want to see the path)
  const valid = validMoves.includes(selectedTile);

  if (!valid) {
    return {
      valid: false,
      expectedTile: validMoves[0] || null,
      reason: selectedTile <= currentTile
        ? 'manual.error.backwards'
        : (selectedTile > currentTile + diceValue
            ? 'manual.error.tooFar'
            : 'manual.error.invalidMove'),
    };
  }

  return { valid: true, expectedTile: selectedTile };
}

/**
 * Calculate the position after applying a movement penalty.
 * @param {number} currentTile - Player's current tile
 * @param {string} penaltyType - Type of penalty
 * @returns {number} Resulting tile after penalty
 */
export function applyPenalty(currentTile, penaltyType) {
  switch (penaltyType) {
    case PENALTIES.MOVE_BACK_3:
      return Math.max(1, currentTile - 3);
    case PENALTIES.MOVE_BACK_5:
      return Math.max(1, currentTile - 5);
    case PENALTIES.LOSE_TURN:
    case PENALTIES.SKIP_NEXT_ROLL:
    case PENALTIES.OPPONENT_FREE_ROLL:
    default:
      return currentTile; // No position change
  }
}

/**
 * Check if a penalty type affects the player's position.
 * @param {string} penaltyType
 * @returns {boolean}
 */
export function penaltyAffectsPosition(penaltyType) {
  return penaltyType === PENALTIES.MOVE_BACK_3 || penaltyType === PENALTIES.MOVE_BACK_5;
}