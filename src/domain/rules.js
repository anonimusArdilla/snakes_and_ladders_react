/**
 * Domain Layer — Game Rules
 *
 * Pure functions governing player movement, turn logic, and win conditions.
 * No React, no side effects — fully testable.
 */

import { BOARD_SIZE, getTileInteraction } from './board.js';

/**
 * Calculate the new position after a dice roll.
 * If the roll would overshoot BOARD_SIZE, the player bounces back.
 *
 * @param {number} currentTile - Current tile (1-based)
 * @param {number} diceValue - Dice roll result (1–6)
 * @returns {{ tile: number, interaction: object|null, bounced: boolean }}
 */
export function movePlayer(currentTile, diceValue) {
  let newTile = currentTile + diceValue;
  let bounced = false;

  // Exact landing required; overshoot bounces back
  if (newTile > BOARD_SIZE) {
    newTile = BOARD_SIZE - (newTile - BOARD_SIZE);
    bounced = true;
  }

  const interaction = getTileInteraction(newTile);

  return { tile: newTile, interaction, bounced };
}

/**
 * Apply a snake or ladder interaction.
 * @param {number} tile - Current tile after dice move
 * @param {object} interaction - { type, from, to }
 * @returns {number} Final tile after interaction
 */
export function applyInteraction(tile, interaction) {
  if (!interaction) return tile;
  return interaction.to;
}

/**
 * Check if a player has won.
 * @param {number} tile
 * @returns {boolean}
 */
export function hasWon(tile) {
  return tile === BOARD_SIZE;
}

/**
 * Determine whose turn is next.
 * @param {'player'|'ai'} currentPlayer
 * @returns {'player'|'ai'}
 */
export function nextTurn(currentPlayer) {
  return currentPlayer === 'player' ? 'ai' : 'player';
}

/**
 * Full turn resolution: dice roll → movement → interaction → win check.
 * @param {number} currentTile
 * @param {number} diceValue
 * @returns {{ newTile: number, finalTile: number, interaction: object|null, bounced: boolean, won: boolean }}
 */
export function resolveTurn(currentTile, diceValue) {
  const { tile, interaction, bounced } = movePlayer(currentTile, diceValue);
  const finalTile = applyInteraction(tile, interaction);
  const won = hasWon(finalTile);

  return { newTile: tile, finalTile, interaction, bounced, won };
}
