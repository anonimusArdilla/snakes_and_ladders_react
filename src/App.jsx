/**
 * App Component — Updated for Multiplayer
 *
 * Orchestrates single-player and multiplayer game flows.
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from './store/gameStore.js';
import { useSettingsStore } from './store/settingsStore.js';
import { useMultiplayer } from './hooks/useMultiplayer.js';
import Header from './components/Header.jsx';
import StartScreen from './components/StartScreen.jsx';
import Board from './components/Board.jsx';
import Dice from './components/Dice.jsx';
import GameStatus from './components/GameStatus.jsx';
import GameOver from './components/GameOver.jsx';
import Settings from './components/Settings.jsx';
import MultiplayerLobby from './components/MultiplayerLobby.jsx';
import MultiplayerStatus from './components/MultiplayerStatus.jsx';
import MultiplayerGameOver from './components/MultiplayerGameOver.jsx';

export default function App() {
  const { i18n } = useTranslation();
  const theme = useSettingsStore((s) => s.theme);
  const language = useSettingsStore((s) => s.language);
  const gamePhase = useGameStore((s) => s.gamePhase);
  const startGame = useGameStore((s) => s.startGame);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [gameMode, setGameMode] = useState(null); // null | 'single' | 'multi'

  const mp = useMultiplayer();

  // Sync language on mount
  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language]);

  // Auto-detect room code from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlRoom = params.get('room');
    if (urlRoom && gameMode === null) {
      setGameMode('multi');
      mp.connect();
    }
  }, []); // Run once on mount

  // Auto-enter game when multiplayer game starts
  useEffect(() => {
    if (mp.gamePhase === 'playing' && gameMode !== 'multi') {
      setGameMode('multi');
    }
  }, [mp.gamePhase, gameMode]);

  const handleLeaveMultiplayer = () => {
    mp.leaveRoom();
    mp.disconnect();
    setGameMode(null);
  };

  const handleStartSinglePlayer = () => {
    setGameMode('single');
    startGame();
  };

  // ─── Determine what to render ──────────────────────────────

  const renderContent = () => {
    // Multiplayer game in progress (only when actually playing or finished)
    if (gameMode === 'multi' && mp.gameState && (mp.gamePhase === 'playing' || mp.gamePhase === 'finished')) {
      if (mp.gamePhase === 'finished') {
        return (
          <>
            <div className="game-layout">
              <div className="game-sidebar">
                <MultiplayerStatus
                  gameState={mp.gameState}
                  playerId={mp.playerId}
                  players={mp.players}
                  isMyTurn={mp.isMyTurn}
                  myTile={mp.myTile}
                  opponentTile={mp.opponentTile}
                  winner={mp.winner}
                  gamePhase={mp.gamePhase}
                  shareUrl={mp.shareUrl}
                  eventLog={mp.eventLog}
                  onLeave={handleLeaveMultiplayer}
                />
              </div>
              <div className="game-board">
                <Board
                  playerTile={mp.amIPlayer1 ? mp.gameState.player1Tile : mp.gameState.player2Tile}
                  aiTile={mp.amIPlayer1 ? mp.gameState.player2Tile : mp.gameState.player1Tile}
                  gamePhase={mp.gamePhase}
                />
              </div>
            </div>
            <MultiplayerGameOver
              gameState={mp.gameState}
              playerId={mp.playerId}
              winner={mp.winner}
              onLeave={handleLeaveMultiplayer}
            />
          </>
        );
      }

      return (
        <div className="game-layout">
          <div className="game-sidebar">
            <MultiplayerStatus
              gameState={mp.gameState}
              playerId={mp.playerId}
              players={mp.players}
              isMyTurn={mp.isMyTurn}
              myTile={mp.myTile}
              opponentTile={mp.opponentTile}
              winner={mp.winner}
              gamePhase={mp.gamePhase}
              shareUrl={mp.shareUrl}
              eventLog={mp.eventLog}
              onLeave={handleLeaveMultiplayer}
            />
            <Dice
              isRolling={false}
              diceValue={mp.gameState.diceValue}
              onRoll={mp.rollDice}
              canRoll={mp.isMyTurn && mp.gamePhase === 'playing'}
              isMultiplayer
              isAiThinking={!mp.isMyTurn}
            />
          </div>
          <div className="game-board">
            <Board
              playerTile={mp.amIPlayer1 ? mp.gameState.player1Tile : mp.gameState.player2Tile}
              aiTile={mp.amIPlayer1 ? mp.gameState.player2Tile : mp.gameState.player1Tile}
              gamePhase={mp.gamePhase}
            />
          </div>
        </div>
      );
    }

    // Multiplayer lobby
    if (gameMode === 'multi' && mp.connectionStatus !== 'disconnected') {
      return (
        <MultiplayerLobby
          connectionStatus={mp.connectionStatus}
          connect={mp.connect}
          disconnect={mp.disconnect}
          createRoom={mp.createRoom}
          joinRoom={mp.joinRoom}
          roomId={mp.roomId}
          players={mp.players}
          shareUrl={mp.shareUrl}
          error={mp.error}
          gamePhase={mp.gamePhase}
        />
      );
    }

    // Single-player game
    if (gameMode === 'single' && gamePhase !== 'idle') {
      return (
        <div className="game-layout">
          <div className="game-sidebar">
            <GameStatus />
            <Dice />
          </div>
          <div className="game-board">
            <Board />
          </div>
        </div>
      );
    }

    // Start screen (default)
    return (
      <StartScreen
        onStartSingle={handleStartSinglePlayer}
        onStartMulti={() => {
          setGameMode('multi');
          mp.connect();
        }}
      />
    );
  };

  return (
    <div className={`app theme-${theme}`}>
      <div className="app-inner">
        <Header
          onSettingsClick={() => setSettingsOpen(true)}
          onBack={
            (gameMode === 'single' && gamePhase !== 'idle') ||
            gameMode === 'multi'
              ? () => {
                  if (gameMode === 'multi') {
                    handleLeaveMultiplayer();
                  } else {
                    useGameStore.getState().resetGame();
                    setGameMode(null);
                  }
                }
              : null
          }
        />

        <main className="main">
          {renderContent()}
        </main>

        {/* Single-player game over */}
        {gameMode === 'single' && <GameOver />}

        {/* Settings */}
        {settingsOpen && <Settings onClose={() => setSettingsOpen(false)} />}
      </div>
    </div>
  );
}
