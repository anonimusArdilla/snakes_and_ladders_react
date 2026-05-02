/**
 * App Component — Orchestrates single-player and multiplayer game flows.
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from './store/gameStore.js';
import { useSettingsStore } from './store/settingsStore.js';
import { useMultiplayer } from './hooks/useMultiplayer.js';
import { useChat } from './hooks/useChat.js';
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
import ChatContainer from './components/chat/ChatContainer.jsx';

export default function App() {
  const { i18n } = useTranslation();
  const theme = useSettingsStore((s) => s.theme);
  const language = useSettingsStore((s) => s.language);
  const manualMode = useSettingsStore((s) => s.manualMode);

  const gamePhase = useGameStore((s) => s.gamePhase);
  const playerTile = useGameStore((s) => s.playerTile);
  const aiTile = useGameStore((s) => s.aiTile);
  const currentPlayer = useGameStore((s) => s.currentPlayer);
  const diceValue = useGameStore((s) => s.diceValue);
  const isRolling = useGameStore((s) => s.isRolling);
  const isAiThinking = useGameStore((s) => s.isAiThinking);
  const lastEvent = useGameStore((s) => s.lastEvent);
  const manualAwaitingSelection = useGameStore((s) => s.manualAwaitingSelection);
  const manualAvailableMoves = useGameStore((s) => s.manualAvailableMoves);
  const manualMistakeCount = useGameStore((s) => s.manualMistakeCount);
  const manualLastPenalty = useGameStore((s) => s.manualLastPenalty);
  const startGame = useGameStore((s) => s.startGame);
  const rollDice = useGameStore((s) => s.rollDice);
  const movePlayerToTile = useGameStore((s) => s.movePlayerToTile);
  const resetGame = useGameStore((s) => s.resetGame);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [gameMode, setGameMode] = useState(null); // null | 'single' | 'multi'

  const mp = useMultiplayer(manualMode);

  // Chat — only active during multiplayer
  const chat = useChat(mp.wsRef, mp.playerId, mp.roomId);
  const [chatCollapsed, setChatCollapsed] = useState(true);

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
  }, []);

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

  // Can the human player roll the dice?
  const canRoll = !isRolling && !isAiThinking && gamePhase === 'playing' && currentPlayer === 'player';

  // ─── Determine what to render ──────────────────────────────

  const renderContent = () => {
    // Multiplayer game in progress (playing or finished)
    if (gameMode === 'multi' && mp.gameState && (mp.gamePhase === 'playing' || mp.gamePhase === 'finished')) {
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
              roomId={mp.roomId}
              eventLog={mp.eventLog}
              onLeave={handleLeaveMultiplayer}
            />
            {mp.gamePhase === 'playing' && (
              <Dice
                isRolling={false}
                diceValue={mp.gameState.diceValue}
                onRoll={mp.rollDice}
                canRoll={mp.isMyTurn && mp.gamePhase === 'playing' && mp.manualDiceValue === null}
                isMultiplayer
                isAiThinking={!mp.isMyTurn}
                manualMode={mp.manualMode}
                manualAwaitingSelection={mp.manualMode && mp.manualDiceValue !== null}
                manualMistakeCount={mp.manualMistakeCount}
                manualLastPenalty={mp.manualLastPenalty}
              />
            )}
          </div>
          <div className="game-board">
            <Board
              playerTile={mp.amIPlayer1 ? mp.gameState.player1Tile : mp.gameState.player2Tile}
              aiTile={mp.amIPlayer1 ? mp.gameState.player2Tile : mp.gameState.player1Tile}
              gamePhase={mp.gamePhase}
              manualMode={mp.manualMode && mp.gamePhase === 'playing'}
              manualAwaitingSelection={mp.manualMode && mp.gamePhase === 'playing' && mp.manualDiceValue !== null}
              manualAvailableMoves={mp.manualAvailableMoves}
              onTileClick={mp.manualMode && mp.gamePhase === 'playing' && mp.manualDiceValue !== null ? mp.selectTile : undefined}
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
          leaveRoom={mp.leaveRoom}
          roomId={mp.roomId}
          players={mp.players}
          shareUrl={mp.shareUrl}
          error={mp.error}
          gamePhase={mp.gamePhase}
        />
      );
    }

    // Single-player game (normal or manual mode — both use gameStore)
    if (gameMode === 'single' && gamePhase !== 'idle') {
      return (
        <div className="game-layout">
          <div className="game-sidebar">
            <GameStatus
              manualMode={manualMode}
              manualAwaitingSelection={manualAwaitingSelection}
              manualMistakeCount={manualMistakeCount}
              manualLastPenalty={manualLastPenalty}
            />
            <Dice
              manualMode={manualMode}
              manualAwaitingSelection={manualAwaitingSelection}
              manualMistakeCount={manualMistakeCount}
              manualLastPenalty={manualLastPenalty}
            />
          </div>
          <div className="game-board">
            <Board
              manualMode={manualMode}
              manualAwaitingSelection={manualAwaitingSelection}
              manualAvailableMoves={manualAvailableMoves}
              onTileClick={manualMode ? movePlayerToTile : undefined}
            />
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
            gameMode === 'single' || gameMode === 'multi'
              ? () => {
                  if (gameMode === 'multi') {
                    handleLeaveMultiplayer();
                  } else {
                    resetGame();
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

        {/* Multiplayer game over — rendered outside renderContent so it survives state transitions */}
        {gameMode === 'multi' && mp.gameState && mp.gamePhase === 'finished' && mp.winner && (
          <MultiplayerGameOver
            gameState={mp.gameState}
            playerId={mp.playerId}
            winner={mp.winner}
            onLeave={handleLeaveMultiplayer}
          />
        )}

        {/* Settings */}
        {settingsOpen && <Settings onClose={() => setSettingsOpen(false)} />}

        {/* Chat — shown only when both players have joined the room */}
        {gameMode === 'multi' && mp.players.length >= 2 && (
          <ChatContainer
            messages={chat.messages}
            unreadCount={chat.unreadCount}
            sendMessage={chat.sendMessage}
            markSeen={chat.markSeen}
            playerId={mp.playerId}
            connectionStatus={mp.connectionStatus}
            isCollapsed={chatCollapsed}
            onToggle={() => setChatCollapsed((prev) => !prev)}
          />
        )}
      </div>
    </div>
  );
}