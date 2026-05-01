/**
 * Settings Panel
 *
 * Theme, language, sound, and manual mode controls.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../store/settingsStore.js';
import { useGameStore } from '../store/gameStore.js';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
];

export default function Settings({ onClose }) {
  const { t, i18n } = useTranslation();
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const toggleSound = useSettingsStore((s) => s.toggleSound);
  const manualMode = useSettingsStore((s) => s.manualMode);
  const toggleManualMode = useSettingsStore((s) => s.toggleManualMode);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const gamePhase = useGameStore((s) => s.gamePhase);
  const isGameActive = gamePhase !== 'idle';

  const handleLanguageChange = (code) => {
    setLanguage(code);
    i18n.changeLanguage(code);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-settings" onClick={(e) => e.stopPropagation()}>
        <h2 className="settings-title">{t('settings.title')}</h2>

        {/* Theme */}
        <div className="settings-group">
          <label className="settings-label">{t('settings.theme')}</label>
          <div className="settings-toggle-group">
            <button
              className={`btn-toggle ${theme === 'light' ? 'active' : ''}`}
              onClick={() => setTheme('light')}
            >
              ☀️ {t('settings.theme.light')}
            </button>
            <button
              className={`btn-toggle ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => setTheme('dark')}
            >
              🌙 {t('settings.theme.dark')}
            </button>
          </div>
        </div>

        {/* Language */}
        <div className="settings-group">
          <label className="settings-label">{t('settings.language')}</label>
          <div className="settings-toggle-group">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                className={`btn-toggle ${i18n.language === lang.code ? 'active' : ''}`}
                onClick={() => handleLanguageChange(lang.code)}
              >
                {lang.flag} {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Manual Mode */}
        <div className="settings-group">
          <label className="settings-label">{t('settings.manualMode')}</label>
          <div className="settings-toggle-group">
            <button
              className={`btn-toggle ${!manualMode ? 'active' : ''}`}
              onClick={() => manualMode && toggleManualMode()}
              disabled={isGameActive}
            >
              🤖 {t('settings.manualMode.auto')}
            </button>
            <button
              className={`btn-toggle ${manualMode ? 'active' : ''}`}
              onClick={() => !manualMode && toggleManualMode()}
              disabled={isGameActive}
            >
              🖱️ {t('settings.manualMode.manual')}
            </button>
          </div>
          <p className="settings-hint">{t('settings.manualMode.hint')}</p>
        </div>

        {/* Sound */}
        <div className="settings-group">
          <label className="settings-label">{t('settings.sound')}</label>
          <div className="settings-toggle-group">
            <button
              className={`btn-toggle ${soundEnabled ? 'active' : ''}`}
              onClick={() => !soundEnabled && toggleSound()}
            >
              🔊 {t('settings.sound.on')}
            </button>
            <button
              className={`btn-toggle ${!soundEnabled ? 'active' : ''}`}
              onClick={() => soundEnabled && toggleSound()}
            >
              🔇 {t('settings.sound.off')}
            </button>
          </div>
        </div>

        <button className="btn btn-secondary btn-close-settings" onClick={onClose}>
          ✕
        </button>
      </div>
    </div>
  );
}