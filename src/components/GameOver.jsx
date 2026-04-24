/**
 * GameOver Component
 *
 * Modal overlay showing win/loss result with stats and restart option.
 */
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/gameStore.js';
import { useStatsStore } from '../store/statsStore.js';
import { useSound } from '../hooks/useSound.js';

export default function GameOver() {
  const { t } = useTranslation();
  const gamePhase = useGameStore((s) => s.gamePhase);
  const winner = useGameStore((s) => s.winner);
  const startGame = useGameStore((s) => s.startGame);
  const resetGame = useGameStore((s) => s.resetGame);
  const wins = useStatsStore((s) => s.wins);
  const losses = useStatsStore((s) => s.losses);
  const recordWin = useStatsStore((s) => s.recordWin);
  const recordLoss = useStatsStore((s) => s.recordLoss);
  const play = useSound();

  const isWin = winner === 'player';

  useEffect(() => {
    if (gamePhase === 'finished') {
      if (isWin) {
        recordWin();
        play('win');
      } else {
        recordLoss();
        play('lose');
      }
    }
  }, [gamePhase]);

  if (gamePhase !== 'finished') return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className={`result-icon ${isWin ? 'result-win' : 'result-lose'}`}>
          {isWin ? '🎉' : '😔'}
        </div>
        <h2 className="result-title">
          {isWin ? t('result.win') : t('result.lose')}
        </h2>
        <p className="result-subtitle">
          {isWin ? t('result.win.sub') : t('result.lose.sub')}
        </p>

        <div className="result-stats">
          <div className="stat">
            <span className="stat-value">{wins}</span>
            <span className="stat-label">{t('stats.wins')}</span>
          </div>
          <div className="stat">
            <span className="stat-value">{losses}</span>
            <span className="stat-label">{t('stats.losses')}</span>
          </div>
        </div>

        <div className="result-actions">
          <button className="btn btn-primary" onClick={startGame}>
            {t('action.restart')}
          </button>
          <button className="btn btn-secondary" onClick={resetGame}>
            {t('action.newGame')}
          </button>
        </div>
      </div>
    </div>
  );
}
