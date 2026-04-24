/**
 * Sound Utility
 *
 * Uses Web Audio API for lightweight, dependency-free sound effects.
 * No external audio files needed — generates tones programmatically.
 */

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playTone(frequency, duration, type = 'sine', volume = 0.15) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio not available — silent fallback
  }
}

export const sounds = {
  diceRoll() {
    // Quick rattling clicks
    for (let i = 0; i < 4; i++) {
      setTimeout(() => playTone(800 + Math.random() * 400, 0.05, 'square', 0.08), i * 60);
    }
  },

  move() {
    playTone(440, 0.08, 'sine', 0.1);
  },

  snake() {
    // Descending hiss
    playTone(300, 0.3, 'sawtooth', 0.1);
    setTimeout(() => playTone(200, 0.2, 'sawtooth', 0.08), 100);
  },

  ladder() {
    // Ascending chime
    playTone(523, 0.1, 'sine', 0.12);
    setTimeout(() => playTone(659, 0.1, 'sine', 0.12), 100);
    setTimeout(() => playTone(784, 0.15, 'sine', 0.15), 200);
  },

  win() {
    // Victory fanfare
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.2, 'sine', 0.15), i * 150);
    });
  },

  lose() {
    // Sad descending
    playTone(400, 0.3, 'sine', 0.12);
    setTimeout(() => playTone(300, 0.3, 'sine', 0.1), 200);
    setTimeout(() => playTone(200, 0.5, 'sine', 0.08), 400);
  },

  bounce() {
    playTone(350, 0.1, 'triangle', 0.1);
    setTimeout(() => playTone(280, 0.15, 'triangle', 0.08), 80);
  },
};
