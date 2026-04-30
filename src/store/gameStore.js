/**
 * Game Store — Zustand State Management
 *
 * Single source of truth for all game state.
 * Actions are pure state transitions; domain logic lives in domain/.
 */
import { create } from 'zustand';
import { rollDice } from '../domain/dice.js';
import { resolveTurn, nextTurn } from '../domain/rules.js';
import { BOARD_SIZE } from '../domain/board.js';

// Issue 5 fix: Extract hardcoded timing values to constants
export const DICE_ANIMATION_MS = 600;
export const AI_THINK_MIN_MS = 800;
export const AI_THINK_MAX_MS = 1500;

const INITIAL_STATE = {
  // Board positions (1-based, 0 = not started)
  playerTile: 0,
  aiTile: 0,

  // Turn management
  currentPlayer: 'player', // 'player' | 'ai'
  diceValue: null,
  isRolling: false,
  isAiThinking: false,

  // Game lifecycle
  gamePhase: 'idle', // 'idle' | 'playing' | 'finished'
  winner: null,      // 'player' | 'ai'

  // Last event (for UI feedback)
  lastEvent: null,    // { type: 'snake'|'ladder'|'bounce'|'normal', tile: number }

  // Path history for animation
  playerPath: [],
  aiPath: [],
};

export const useGameStore = create((set, get) => ({
  ...INITIAL_STATE,

  // Start a new game
  startGame: () => {
    set({
      ...INITIAL_STATE,
      gamePhase: 'playing',
      currentPlayer: 'player',
      playerTile: 1,
      aiTile: 1,
      playerPath: [1],
      aiPath: [1],
    });
  },

  // Roll dice and resolve turn for current player
  rollDice: () => {
    const state = get();
    if (state.isRolling || state.isAiThinking || state.gamePhase !== 'playing') return;

    const dice = rollDice();
    const currentTile = state.currentPlayer === 'player' ? state.playerTile : state.aiTile;

    // Build animation path: step through each intermediate tile
    const path = [];
    for (let i = 1; i <= dice; i++) {
      let next = currentTile + i;
      if (next > BOARD_SIZE) {
        next = BOARD_SIZE - (next - BOARD_SIZE);
      }
      path.push(next);
    }

    const result = resolveTurn(currentTile, dice);

    // Build final path including snake/ladder
    if (result.interaction) {
      path.push(result.finalTile);
    }

    set({ isRolling: true, diceValue: dice });

    // Issue 5 fix: Use named constant instead of magic number
    setTimeout(() => {
      const updates = {
        isRolling: false,
        lastEvent: result.interaction
          ? { type: result.interaction.type, tile: result.finalTile }
          : result.bounced
            ? { type: 'bounce', tile: result.finalTile }
            : { type: 'normal', tile: result.finalTile },
      };

      if (state.currentPlayer === 'player') {
        updates.playerTile = result.finalTile;
        updates.playerPath = [...state.playerPath, ...path];
      } else {
        updates.aiTile = result.finalTile;
        updates.aiPath = [...state.aiPath, ...path];
      }

      if (result.won) {
        updates.gamePhase = 'finished';
        updates.winner = state.currentPlayer;
        set(updates);
        return;
      }

      // Switch turns
      updates.currentPlayer = nextTurn(state.currentPlayer);
      set(updates);

      // If next is AI, auto-roll after delay
      if (updates.currentPlayer === 'ai') {
        get().scheduleAiTurn();
      }
    }, DICE_ANIMATION_MS);
  },

  // AI auto-roll with natural delay
  scheduleAiTurn: () => {
    set({ isAiThinking: true });
    // Issue 5 fix: Use named constants instead of magic numbers
    const delay = AI_THINK_MIN_MS + Math.random() * (AI_THINK_MAX_MS - AI_THINK_MIN_MS);
    setTimeout(() => {
      const state = get();
      if (state.gamePhase !== 'playing') return;
      set({ isAiThinking: false });
      get().rollDice();
    }, delay);
  },

  // Reset everything
  resetGame: () => {
    set(INITIAL_STATE);
  },
}));