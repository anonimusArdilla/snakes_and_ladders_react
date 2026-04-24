/**
 * Domain Layer — Dice Logic
 *
 * Pure, deterministic dice rolling with seeded random support for testing.
 */

/**
 * Roll a standard 6-sided dice.
 * @param {Function} rng - Random number generator (defaults to Math.random)
 * @returns {number} 1–6
 */
export function rollDice(rng = Math.random) {
  return Math.floor(rng() * 6) + 1;
}

/**
 * Create a seeded PRNG (mulberry32) for deterministic testing.
 * @param {number} seed
 * @returns {Function} RNG function returning 0–1
 */
export function createSeededRNG(seed) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
