/**
 * Game Store — Zustand State Management
 *
 * Single source of truth for all game state.
 * Supports both normal (auto-move) and manual (player picks tile) modes.
 */
import { create } from 'zustand';
import { rollDice } from '../domain/dice.js';
import { resolveTurn, nextTurn } from '../domain/rules.js';
import { BOARD_SIZE } from '../domain/board.js';
import { calculateValidMoves, validateMove, getPenalty, applyPenalty } from '../domain/manualMode.js';
import { useSettingsStore } from './settingsStore.js';

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

  // Manual mode state (when manualMode setting is on)
  manualAwaitingSelection: false, // true = player must click a tile
  manualAvailableMoves: [],       // tiles the player can click
  manualMistakeCount: 0,
  manualLastPenalty: null,        // { type, label, description }
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

    // In manual mode, if it's the player's turn, show valid moves instead of auto-moving
    const manualMode = useSettingsStore.getState().manualMode;

    if (manualMode && state.currentPlayer === 'player') {
      const validMoves = calculateValidMoves(currentTile, dice);
      set({
        isRolling: true,
        diceValue: dice,
      });
      setTimeout(() => {
        set({
          isRolling: false,
          manualAwaitingSelection: true,
          manualAvailableMoves: validMoves,
        });
      }, DICE_ANIMATION_MS);
      return;
    }

    // Normal mode or AI turn — auto-resolve
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

  /**
   * Manual mode: player clicks a tile to move there.
   * @param {number} selectedTile - The tile the player clicked
   */
  movePlayerToTile: (selectedTile) => {
    const state = get();
    if (!state.manualAwaitingSelection || state.gamePhase !== 'playing') return;

    const validation = validateMove(selectedTile, state.playerTile, state.diceValue);

    if (!validation.valid) {
      // Player made a mistake — apply penalty
      const newMistakeCount = state.manualMistakeCount + 1;
      const penalty = getPenalty(newMistakeCount);
      let newPlayerTile = state.playerTile;

      // Apply position penalty
      newPlayerTile = applyPenalty(newPlayerTile, penalty.type);

      // Check if penalty skips turn
      const skipTurn = penalty.type === 'loseTurn';

      set({
        manualAwaitingSelection: false,
        manualAvailableMoves: [],
        manualMistakeCount: newMistakeCount,
        manualLastPenalty: penalty,
        playerTile: newPlayerTile,
        playerPath: [...state.playerPath, newPlayerTile],
        lastEvent: { type: 'bounce', tile: newPlayerTile },
        currentPlayer: skipTurn ? 'ai' : 'player',
      });

      if (skipTurn) {
        get().scheduleAiTurn();
      }
      return;
    }

    // Valid move — resolve tiles (snakes/ladders) at the destination
    const diceUsed = selectedTile - state.playerTile;
    const result = resolveTurn(state.playerTile, diceUsed);

    // Build path for animation
    const selectedPath = [];
    for (let i = state.playerTile + 1; i <= selectedTile; i++) {
      selectedPath.push(i);
    }
    if (result.interaction) {
      selectedPath.push(result.finalTile);
    }

    const updates = {
      manualAwaitingSelection: false,
      manualAvailableMoves: [],
      manualLastPenalty: null,
      playerTile: result.finalTile,
      playerPath: [...state.playerPath, ...selectedPath, result.finalTile].filter(
        (v, i, a) => a.indexOf(v) === i
      ),
      lastEvent: result.interaction
        ? { type: result.interaction.type, tile: result.finalTile }
        : result.bounced
          ? { type: 'bounce', tile: result.finalTile }
          : { type: 'normal', tile: result.finalTile },
    };

    if (result.won) {
      updates.gamePhase = 'finished';
      updates.winner = 'player';
      set(updates);
      return;
    }

    // Switch to AI turn
    updates.currentPlayer = 'ai';
    set(updates);

    // AI plays automatically
    get().scheduleAiTurn();
  },

  // AI auto-roll with natural delay
  scheduleAiTurn: () => {
    set({ isAiThinking: true });
    const delay = AI_THINK_MIN_MS + Math.random() * (AI_THINK_MAX_MS - AI_THINK_MIN_MS);
    setTimeout(() => {
      const state = get();
      if (state.gamePhase !== 'playing') return;
      set({ isAiThinking: false });
      state.rollDice();
    }, delay);
  },

  // Reset everything
  resetGame: () => {
    set(INITIAL_STATE);
  },
}));