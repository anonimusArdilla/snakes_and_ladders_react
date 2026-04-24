/**
 * Header Component
 *
 * Game title, stats display, and settings button.
 * Optional back button for returning to menu.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/gameStore.js';
import { useStatsStore } from '../store/statsStore.js';

export default function Header({ onSettingsClick, onBack }) {
  const { t } = useTranslation();
  const gamePhase = useGameStore((s) => s.gamePhase);
  const wins = useStatsStore((s) => s.wins);
  const losses = useStatsStore((s) => s.losses);

  return (
    <header className="header">
      <div className="header-left">
        {onBack ? (
          <button className="btn btn-icon btn-back" onClick={onBack} title="Back to menu">
            ←
          </button>
        ) : null}
        <div>
          <h1 className="game-title">
            <span className="title-icon">🎲</span>
            {t('game.title')}
          </h1>
          <p className="game-subtitle">{t('game.subtitle')}</p>
        </div>
      </div>

      <div className="header-right">
        {gamePhase !== 'idle' && (
          <div className="header-stats">
            <span className="stat-badge stat-win">🏆 {wins}</span>
            <span className="stat-badge stat-loss">💀 {losses}</span>
          </div>
        )}

        <button className="btn btn-icon" onClick={onSettingsClick} title={t('settings.title')}>
          ⚙️
        </button>
      </div>
    </header>
  );
}
