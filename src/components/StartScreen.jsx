/**
 * StartScreen Component
 *
 * Landing screen with game description, mode selection, and stats.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useStatsStore } from '../store/statsStore.js';
import { useSettingsStore } from '../store/settingsStore.js';

export default function StartScreen({ onStartSingle, onStartMulti }) {
  const { t } = useTranslation();
  const wins = useStatsStore((s) => s.wins);
  const losses = useStatsStore((s) => s.losses);
  const games = wins + losses;
  const manualMode = useSettingsStore((s) => s.manualMode);
  const toggleManualMode = useSettingsStore((s) => s.toggleManualMode);

  return (
    <div className="start-screen">
      <div className="start-hero">
        <div className="start-board-preview">
          <div className="mini-board">
            {Array.from({ length: 100 }, (_, i) => (
              <div key={i} className={`mini-tile ${i % 2 === 0 ? 'mini-even' : 'mini-odd'}`} />
            ))}
            <div className="mini-snakes">
              <span className="mini-snake" style={{ top: '16%', left: '55%' }}>🐍</span>
              <span className="mini-snake" style={{ top: '46%', left: '35%' }}>🐍</span>
              <span className="mini-snake" style={{ top: '76%', left: '75%' }}>🐍</span>
            </div>
            <div className="mini-ladders">
              <span className="mini-ladder" style={{ top: '82%', left: '15%' }}>🪜</span>
              <span className="mini-ladder" style={{ top: '62%', left: '55%' }}>🪜</span>
              <span className="mini-ladder" style={{ top: '22%', left: '35%' }}>🪜</span>
            </div>
          </div>
        </div>

        <h2 className="start-title">{t('game.title')}</h2>
        <p className="start-desc">{t('game.subtitle')}</p>

        <div className="start-modes">
          <button className="btn btn-primary btn-start" onClick={onStartSingle}>
            🤖 vs AI
          </button>
          <button className="btn btn-accent btn-start" onClick={onStartMulti}>
            🌐 Online
          </button>
        </div>

        {/* Manual Mode Toggle — only affects single-player */}
        <div className="start-manual-toggle">
          <span className="start-manual-label">{t('settings.manualMode')}</span>
          <div className="settings-toggle-group">
            <button
              className={`btn-toggle ${!manualMode ? 'active' : ''}`}
              onClick={() => manualMode && toggleManualMode()}
            >
              🤖 {t('settings.manualMode.auto')}
            </button>
            <button
              className={`btn-toggle ${manualMode ? 'active' : ''}`}
              onClick={() => !manualMode && toggleManualMode()}
            >
              🖱️ {t('settings.manualMode.manual')}
            </button>
          </div>
        </div>

        {games > 0 && (
          <div className="start-stats">
            <span>🏆 {wins}</span>
            <span>💀 {losses}</span>
            <span>🎮 {games}</span>
          </div>
        )}
      </div>

      <div className="start-rules">
        <div className="rule">
          <span className="rule-icon">🎲</span>
          <span>Roll the dice, race to tile 100</span>
        </div>
        <div className="rule">
          <span className="rule-icon">🪜</span>
          <span>Ladders boost you up</span>
        </div>
        <div className="rule">
          <span className="rule-icon">🐍</span>
          <span>Snakes pull you down</span>
        </div>
        <div className="rule">
          <span className="rule-icon">🌐</span>
          <span>Share a link to play with friends</span>
        </div>
      </div>
    </div>
  );
}
