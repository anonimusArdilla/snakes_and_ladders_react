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
 * Max chain depth to prevent infinite loops with circular snake/ladder chains.
 * (In the classic game, snakes and ladders do not chain, but this is a safety guard.)
 */
const MAX_CHAIN_DEPTH = 10;

/**
 * Resolve a tile fully, including snake/ladder chains.
 * In the classic game, landing on a snake/ladder always takes you to the destination,
 * and you do NOT chain (i.e., landing on another snake/ladder at the end is not
 * supposed to happen in the standard rules). However, this handles potential
 * edge cases where a ladder could land on a snake or vice versa.
 *
 * @param {number} tile - Starting tile
 * @param {number} depth - Internal recursion guard
 * @returns {{ finalTile: number, interactions: Array<{type: string, from: number, to: number}>, bounced: boolean }}
 */
export function resolveTile(tile, depth = 0) {
  if (depth >= MAX_CHAIN_DEPTH) {
    // Safety: if we've chained too many times, just stop
    return { finalTile: tile, interactions: [], bounced: false };
  }

  const interaction = getTileInteraction(tile);
  if (!interaction) {
    return { finalTile: tile, interactions: [], bounced: false };
  }

  // Apply the interaction and check if the destination itself has an interaction
  const nextTile = interaction.to;
  const chainResult = resolveTile(nextTile, depth + 1);

  return {
    finalTile: chainResult.finalTile,
    interactions: [interaction, ...chainResult.interactions],
    bounced: false,
  };
}

/**
 * Full turn resolution: dice roll → movement → interaction → win check.
 * Resolves snake/ladder chains properly (Issue 14 fix).
 *
 * @param {number} currentTile
 * @param {number} diceValue
 * @returns {{ newTile: number, finalTile: number, interaction: object|null, interactions: Array, bounced: boolean, won: boolean }}
 */
export function resolveTurn(currentTile, diceValue) {
  const { tile, interaction, bounced } = movePlayer(currentTile, diceValue);

  // Resolve chains: landing on a snake/ladder that leads to another snake/ladder
  const { finalTile, interactions } = resolveTile(
    interaction ? interaction.to : tile,
    0
  );

  // The primary interaction is the first one (most relevant for UI display)
  const primaryInteraction = interactions.length > 0 ? interactions[0] : null;
  const won = hasWon(finalTile);

  return {
    newTile: tile,
    finalTile,
    interaction: primaryInteraction,
    interactions,
    bounced,
    won,
  };
}