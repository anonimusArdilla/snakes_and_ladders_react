/**
 * Domain Layer — Board Configuration
 *
 * Defines the snakes and ladders mapping.
 * Keys are the "from" tile, values are the "to" tile.
 * Snakes: from > to (slide down)
 * Ladders: from < to (climb up)
 */

export const BOARD_SIZE = 100;

// Snakes: head → tail
export const SNAKES = {
  16: 6,
  47: 26,
  49: 11,
  56: 53,
  62: 19,
  64: 60,
  87: 24,
  93: 73,
  95: 75,
  98: 78,
};

// Ladders: bottom → top
export const LADDERS = {
  1: 38,
  4: 14,
  9: 31,
  21: 42,
  28: 84,
  36: 44,
  51: 67,
  71: 91,
  80: 100,
};

/**
 * Check if a tile has a snake or ladder and return the destination.
 * Returns null if no interaction.
 */
export function getTileInteraction(tile) {
  if (SNAKES[tile]) {
    return { type: 'snake', from: tile, to: SNAKES[tile] };
  }
  if (LADDERS[tile]) {
    return { type: 'ladder', from: tile, to: LADDERS[tile] };
  }
  return null;
}

/**
 * Generate row/column position for a tile on the board.
 * Board is numbered bottom-left to top-right, zigzag per row.
 */
export function getTilePosition(tile) {
  const row = Math.floor((tile - 1) / 10);
  const col = (tile - 1) % 10;
  // Odd rows go right-to-left (zigzag)
  const actualCol = row % 2 === 0 ? col : 9 - col;
  return { row: 9 - row, col: actualCol };
}
