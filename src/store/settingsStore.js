/**
 * Settings Store — Theme, Language, Sound preferences
 * Persisted to localStorage.
 */
import { create } from 'zustand';

const STORAGE_KEY = 'snl_settings';

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {}
}

const defaults = {
  theme: 'dark',
  language: 'en',
  soundEnabled: true,
};

const saved = loadSettings();

export const useSettingsStore = create((set, get) => ({
  ...defaults,
  ...saved,

  setTheme: (theme) => {
    set({ theme });
    saveSettings({ ...get(), theme });
  },

  setLanguage: (language) => {
    set({ language });
    saveSettings({ ...get(), language });
  },

  toggleSound: () => {
    const next = !get().soundEnabled;
    set({ soundEnabled: next });
    saveSettings({ ...get(), soundEnabled: next });
  },
}));
