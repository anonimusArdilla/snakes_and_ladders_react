/**
 * Stats Store — Win/Loss tracking
 * Persisted to localStorage.
 */
import { create } from 'zustand';

const STATS_KEY = 'snl_stats';

function loadStats() {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { wins: 0, losses: 0 };
}

function saveStats(stats) {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {}
}

export const useStatsStore = create((set, get) => ({
  ...loadStats(),

  recordWin: () => {
    const next = { ...get(), wins: get().wins + 1 };
    delete next.recordWin;
    delete next.recordLoss;
    delete next.reset;
    set({ wins: get().wins + 1 });
    saveStats({ wins: get().wins, losses: get().losses });
  },

  recordLoss: () => {
    set({ losses: get().losses + 1 });
    saveStats({ wins: get().wins, losses: get().losses });
  },

  reset: () => {
    set({ wins: 0, losses: 0 });
    saveStats({ wins: 0, losses: 0 });
  },
}));
