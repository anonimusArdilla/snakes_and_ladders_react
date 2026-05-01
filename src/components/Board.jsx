/**
 * Board Component
 *
 * Renders the game board with numbered tiles,
 * snake/ladder indicators, and player tokens.
 * Supports both single-player (from store) and multiplayer (from props).
 * Shows colored arrows — red for snakes, green for ladders.
 * Supports clickable tiles for manual mode (user moves piece).
 */
import React, { memo, useMemo, useCallback } from 'react';
import { BOARD_SIZE, SNAKES, LADDERS, getTilePosition } from '../domain/board.js';
import { useGameStore } from '../store/gameStore.js';
import { useSettingsStore } from '../store/settingsStore.js';

const GRID_COLS = Math.sqrt(BOARD_SIZE);
const GRID_ROWS = Math.sqrt(BOARD_SIZE);

// Generate all tile numbers in board order (bottom-left to top-right, zigzag)
function generateBoardTiles() {
  const tiles = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    const rowTiles = [];
    for (let col = 0; col < GRID_COLS; col++) {
      const tileNum = row * GRID_COLS + col + 1;
      rowTiles.push(tileNum);
    }
    if (row % 2 === 1) rowTiles.reverse();
    tiles.push(rowTiles);
  }
  return tiles.reverse();
}

function getTileColor(tile, isManualMode, validMoves) {
  if (isManualMode && validMoves.includes(tile)) return 'var(--tile-valid-move)';
  if (SNAKES[tile]) return 'var(--tile-snake)';
  if (LADDERS[tile]) return 'var(--tile-ladder)';
  if (tile === 1) return 'var(--tile-start)';
  if (tile === BOARD_SIZE) return 'var(--tile-finish)';
  return tile % 2 === 0 ? 'var(--tile-even)' : 'var(--tile-odd)';
}

const Tile = memo(function Tile({ tile, playerTile, aiTile, gamePhase, isManualMode, validMoves, awaitingSelection, onTileClick }) {
  const isPlayer = playerTile === tile && gamePhase !== 'idle';
  const isAi = aiTile === tile && gamePhase !== 'idle';
  const hasSnake = SNAKES[tile];
  const hasLadder = LADDERS[tile];
  const isValidMove = validMoves.includes(tile);
  const isClickable = isManualMode && awaitingSelection && isValidMove;

  const handleClick = useCallback(() => {
    if (isClickable && onTileClick) {
      onTileClick(tile);
    }
  }, [isClickable, onTileClick, tile]);

  const handleKeyDown = useCallback((e) => {
    if (isClickable && onTileClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onTileClick(tile);
    }
  }, [isClickable, onTileClick, tile]);

  return (
    <div
      className={`tile ${hasSnake ? 'tile-snake' : ''} ${hasLadder ? 'tile-ladder' : ''} ${isValidMove ? 'tile-valid-move' : ''} ${isClickable ? 'tile-clickable' : ''}`}
      style={{ backgroundColor: getTileColor(tile, isManualMode, validMoves) }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-label={isClickable ? `Move to tile ${tile}` : undefined}
    >
      <span className="tile-number">{tile}</span>

      {hasSnake && <span className="tile-icon">🐍</span>}
      {hasLadder && <span className="tile-icon">🪜</span>}

      <div className="tile-tokens">
        {isPlayer && (
          <div className="token token-player" title="Player 1">
            <span>🔵</span>
          </div>
        )}
        {isAi && (
          <div className="token token-ai" title="Player 2">
            <span>🔴</span>
          </div>
        )}
      </div>
    </div>
  );
});

/**
 * Renders colored curved arrows over the board to show snake and ladder connections.
 */
const BoardArrows = memo(function BoardArrows() {
  const arrows = useMemo(() => {
    const result = [];

    for (const [from, to] of Object.entries(SNAKES)) {
      const fromPos = getTilePosition(parseInt(from));
      const toPos = getTilePosition(to);
      const x1 = fromPos.col * 10 + 5;
      const y1 = fromPos.row * 10 + 5;
      const x2 = toPos.col * 10 + 5;
      const y2 = toPos.row * 10 + 5;
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const perpDist = Math.max(Math.abs(dx), Math.abs(dy)) * 0.4;
      const cx = midX - dy * (perpDist / Math.sqrt(dx * dx + dy * dy || 1));
      const cy = midY + dx * (perpDist / Math.sqrt(dx * dx + dy * dy || 1));
      const d = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
      result.push({ d, type: 'snake' });
    }

    for (const [from, to] of Object.entries(LADDERS)) {
      const fromPos = getTilePosition(parseInt(from));
      const toPos = getTilePosition(to);
      const x1 = fromPos.col * 10 + 5;
      const y1 = fromPos.row * 10 + 5;
      const x2 = toPos.col * 10 + 5;
      const y2 = toPos.row * 10 + 5;
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const perpDist = Math.max(Math.abs(dx), Math.abs(dy)) * 0.4;
      const cx = midX + dy * (perpDist / Math.sqrt(dx * dx + dy * dy || 1));
      const cy = midY - dx * (perpDist / Math.sqrt(dx * dx + dy * dy || 1));
      const d = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
      result.push({ d, type: 'ladder' });
    }

    return result;
  }, []);

  return (
    <svg className="board-svg-overlay" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <marker id="board-arrow-snake" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--tile-snake)" />
        </marker>
        <marker id="board-arrow-ladder" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--tile-ladder)" />
        </marker>
      </defs>
      {arrows.map((a, i) => (
        <path
          key={i}
          d={a.d}
          fill="none"
          stroke={a.type === 'snake' ? 'var(--tile-snake)' : 'var(--tile-ladder)'}
          strokeWidth="0.6"
          markerEnd={a.type === 'snake' ? 'url(#board-arrow-snake)' : 'url(#board-arrow-ladder)'}
          opacity="0.8"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
});

const Board = memo(function Board({
  playerTile: propPlayerTile,
  aiTile: propAiTile,
  gamePhase: propGamePhase,
  manualMode = false,
  manualAwaitingSelection = false,
  manualAvailableMoves = [],
  onTileClick,
} = {}) {
  const storePlayerTile = useGameStore((s) => s.playerTile);
  const storeAiTile = useGameStore((s) => s.aiTile);
  const storeGamePhase = useGameStore((s) => s.gamePhase);

  // When no props, read from store (normal single-player mode)
  const isManualMode = manualMode || useSettingsStore((s) => s.manualMode);

  const playerTile = propPlayerTile !== undefined ? propPlayerTile : storePlayerTile;
  const aiTile = propAiTile !== undefined ? propAiTile : storeAiTile;
  const gamePhase = propGamePhase || storeGamePhase;

  // In manual mode with props from App, use those props; otherwise use store
  const awaitingSelection = isManualMode
    ? (manualAwaitingSelection !== false ? manualAwaitingSelection : false)
    : false;
  const validMoves = isManualMode ? manualAvailableMoves : [];

  // Get store's manual mode state if props not provided (standalone use)
  const storeManualAwaiting = useGameStore((s) => s.manualAwaitingSelection);
  const storeAvailableMoves = useGameStore((s) => s.manualAvailableMoves);
  const storeOnTileClick = useGameStore((s) => s.movePlayerToTile);

  const effectiveAwaiting = propPlayerTile === undefined ? storeManualAwaiting : awaitingSelection;
  const effectiveMoves = propPlayerTile === undefined ? storeAvailableMoves : validMoves;
  const effectiveOnTileClick = onTileClick || (isManualMode ? storeOnTileClick : undefined);

  const boardTiles = useMemo(generateBoardTiles, []);

  return (
    <div className="board-container">
      <div className={`board ${effectiveAwaiting ? 'board-select-mode' : ''}`}>
        <BoardArrows />
        {boardTiles.map((row, rowIdx) => (
          <div key={rowIdx} className="board-row">
            {row.map((tile) => (
              <Tile
                key={tile}
                tile={tile}
                playerTile={playerTile}
                aiTile={aiTile}
                gamePhase={gamePhase}
                isManualMode={isManualMode}
                validMoves={effectiveMoves}
                awaitingSelection={effectiveAwaiting}
                onTileClick={effectiveOnTileClick}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
});

export default Board;