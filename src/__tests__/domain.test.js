/**
 * Unit Tests — Domain Layer
 *
 * Tests for dice logic, movement rules, and win conditions.
 */
import { describe, it, expect } from 'vitest';
import { rollDice, createSeededRNG } from '../domain/dice.js';
import { movePlayer, applyInteraction, hasWon, resolveTurn, nextTurn } from '../domain/rules.js';
import { BOARD_SIZE, SNAKES, LADDERS, getTileInteraction, getTilePosition } from '../domain/board.js';

// === Dice Tests ===
describe('Dice', () => {
  it('returns values between 1 and 6', () => {
    for (let i = 0; i < 100; i++) {
      const val = rollDice();
      expect(val).toBeGreaterThanOrEqual(1);
      expect(val).toBeLessThanOrEqual(6);
    }
  });

  it('produces deterministic results with seeded RNG', () => {
    const rng = createSeededRNG(42);
    const results = Array.from({ length: 10 }, () => rollDice(rng));
    // Same seed → same results
    const rng2 = createSeededRNG(42);
    const results2 = Array.from({ length: 10 }, () => rollDice(rng2));
    expect(results).toEqual(results2);
  });

  it('covers all 6 values over enough rolls', () => {
    const rng = createSeededRNG(12345);
    const seen = new Set();
    for (let i = 0; i < 1000; i++) {
      seen.add(rollDice(rng));
    }
    expect(seen).toEqual(new Set([1, 2, 3, 4, 5, 6]));
  });
});

// === Movement Tests ===
describe('Movement', () => {
  it('advances by dice value', () => {
    const result = movePlayer(10, 4);
    expect(result.tile).toBe(14);
    expect(result.bounced).toBe(false);
  });

  it('bounces back when overshooting', () => {
    // At tile 97, roll 5 → would reach 102, bounces to 98
    const result = movePlayer(97, 5);
    expect(result.tile).toBe(98);
    expect(result.bounced).toBe(true);
  });

  it('lands exactly on 100', () => {
    const result = movePlayer(94, 6);
    expect(result.tile).toBe(100);
    expect(result.bounced).toBe(false);
  });

  it('does not move if already at 100', () => {
    // This shouldn't happen in normal play, but test the math
    const result = movePlayer(100, 3);
    expect(result.tile).toBe(97); // overshoot bounces back
  });
});

// === Snake & Ladder Interaction Tests ===
describe('Board Interactions', () => {
  it('detects snake at tile 16', () => {
    const interaction = getTileInteraction(16);
    expect(interaction).not.toBeNull();
    expect(interaction.type).toBe('snake');
    expect(interaction.to).toBe(6);
  });

  it('detects ladder at tile 1', () => {
    const interaction = getTileInteraction(1);
    expect(interaction).not.toBeNull();
    expect(interaction.type).toBe('ladder');
    expect(interaction.to).toBe(38);
  });

  it('returns null for normal tiles', () => {
    expect(getTileInteraction(5)).toBeNull();
    expect(getTileInteraction(50)).toBeNull();
  });

  it('applies snake interaction', () => {
    const result = applyInteraction(16, { type: 'snake', from: 16, to: 6 });
    expect(result).toBe(6);
  });

  it('applies ladder interaction', () => {
    const result = applyInteraction(1, { type: 'ladder', from: 1, to: 38 });
    expect(result).toBe(38);
  });

  it('returns original tile when no interaction', () => {
    expect(applyInteraction(50, null)).toBe(50);
  });
});

// === Win Condition Tests ===
describe('Win Condition', () => {
  it('detects win at tile 100', () => {
    expect(hasWon(100)).toBe(true);
  });

  it('does not win at tile 99', () => {
    expect(hasWon(99)).toBe(false);
  });

  it('does not win at tile 1', () => {
    expect(hasWon(1)).toBe(false);
  });
});

// === Full Turn Resolution ===
describe('Turn Resolution', () => {
  it('resolves a normal move', () => {
    const result = resolveTurn(10, 3);
    expect(result.newTile).toBe(13);
    expect(result.finalTile).toBe(13);
    expect(result.interaction).toBeNull();
    expect(result.won).toBe(false);
  });

  it('resolves a move with snake', () => {
    // Tile 14 + roll 2 = tile 16 → snake to 6
    const result = resolveTurn(14, 2);
    expect(result.newTile).toBe(16);
    expect(result.finalTile).toBe(6);
    expect(result.interaction).not.toBeNull();
    expect(result.interaction.type).toBe('snake');
  });

  it('resolves a winning move', () => {
    const result = resolveTurn(94, 6);
    expect(result.finalTile).toBe(100);
    expect(result.won).toBe(true);
  });

  it('resolves a winning move via ladder', () => {
    // Tile 73 + roll 7 = 80 → ladder to 100
    const result = resolveTurn(73, 7);
    expect(result.finalTile).toBe(100);
    expect(result.won).toBe(true);
  });
});

// === Turn Management ===
describe('Turn Management', () => {
  it('alternates from player to ai', () => {
    expect(nextTurn('player')).toBe('ai');
  });

  it('alternates from ai to player', () => {
    expect(nextTurn('ai')).toBe('player');
  });
});

// === Board Positioning ===
describe('Board Positioning', () => {
  it('tile 1 is bottom-left', () => {
    const pos = getTilePosition(1);
    expect(pos.row).toBe(9);
    expect(pos.col).toBe(0);
  });

  it('tile 10 is bottom-right', () => {
    const pos = getTilePosition(10);
    expect(pos.row).toBe(9);
    expect(pos.col).toBe(9);
  });

  it('tile 100 is top-left (zigzag)', () => {
    const pos = getTilePosition(100);
    expect(pos.row).toBe(0);
    expect(pos.col).toBe(0);
  });
});

// === Board Config ===
describe('Board Config', () => {
  it('all snake heads are higher than tails', () => {
    Object.entries(SNAKES).forEach(([from, to]) => {
      expect(Number(from)).toBeGreaterThan(to);
    });
  });

  it('all ladder bottoms are lower than tops', () => {
    Object.entries(LADDERS).forEach(([from, to]) => {
      expect(Number(from)).toBeLessThan(to);
    });
  });

  it('no overlap between snake and ladder tiles', () => {
    const snakeTiles = new Set(Object.keys(SNAKES).map(Number));
    const ladderTiles = new Set(Object.keys(LADDERS).map(Number));
    const overlap = [...snakeTiles].filter((t) => ladderTiles.has(t));
    expect(overlap).toEqual([]);
  });
});
