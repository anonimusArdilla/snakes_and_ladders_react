/**
 * useSound Hook
 *
 * Plays sound effects based on game events.
 * Respects the soundEnabled setting.
 */
import { useEffect, useRef } from 'react';
import { useSettingsStore } from '../store/settingsStore.js';
import { sounds } from '../utils/sounds.js';

export function useSound() {
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const initialized = useRef(false);

  // Initialize AudioContext on first user interaction
  useEffect(() => {
    if (initialized.current) return;
    const handler = () => {
      // Touch AudioContext to unlock it on mobile
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        ctx.resume();
        ctx.close();
      } catch {}
      initialized.current = true;
      document.removeEventListener('click', handler);
      document.removeEventListener('touchstart', handler);
    };
    document.addEventListener('click', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('click', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, []);

  const play = (name) => {
    if (!soundEnabled) return;
    const fn = sounds[name];
    if (fn) fn();
  };

  return play;
}
