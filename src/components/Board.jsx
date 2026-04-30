/**
 * Board Component
 *
 * Renders the game board with numbered tiles,
 * snake/ladder indicators, and player tokens.
 * Supports both single-player (from store) and multiplayer (from props).
 */
import React, { memo, useMemo } from 'react';
import { BOARD_SIZE, SNAKES, LADDERS, getTilePosition } from '../domain/board.js';
import { useGameStore } from '../store/gameStore.js';

// Issue 6 fix: Derive grid size from BOARD_SIZE instead of hardcoding 10
const GRID_COLS = Math.sqrt(BOARD_SIZE); // 10 for standard board
const GRID_ROWS = Math.sqrt(BOARD_SIZE); // 10 for standard board

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
  return tiles.reverse(); // Display top-to-bottom
}

function getTileColor(tile) {
  if (SNAKES[tile]) return 'var(--tile-snake)';
  if (LADDERS[tile]) return 'var(--tile-ladder)';
  if (tile === 1) return 'var(--tile-start)';
  if (tile === BOARD_SIZE) return 'var(--tile-finish)';
  return tile % 2 === 0 ? 'var(--tile-even)' : 'var(--tile-odd)';
}

// Issue 8/18 fix: Memoize individual tile to prevent full re-render on every dice roll
const Tile = memo(function Tile({ tile, playerTile, aiTile, gamePhase }) {
  const isPlayer = playerTile === tile && gamePhase !== 'idle';
  const isAi = aiTile === tile && gamePhase !== 'idle';
  const hasSnake = SNAKES[tile];
  const hasLadder = LADDERS[tile];

  return (
    <div
      className={`tile ${hasSnake ? 'tile-snake' : ''} ${hasLadder ? 'tile-ladder' : ''}`}
      style={{ backgroundColor: getTileColor(tile) }}
      title={
        hasSnake
          ? `Snake: ${tile} → ${SNAKES[tile]}`
          : hasLadder
            ? `Ladder: ${tile} → ${LADDERS[tile]}`
            : `Tile ${tile}`
      }
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

const Board = memo(function Board({ playerTile: propPlayerTile, aiTile: propAiTile, gamePhase: propGamePhase } = {}) {
  const storePlayerTile = useGameStore((s) => s.playerTile);
  const storeAiTile = useGameStore((s) => s.aiTile);
  const storeGamePhase = useGameStore((s) => s.gamePhase);

  // Use props (multiplayer) or store (single-player)
  const playerTile = propPlayerTile !== undefined ? propPlayerTile : storePlayerTile;
  const aiTile = propAiTile !== undefined ? propAiTile : storeAiTile;
  const gamePhase = propGamePhase || storeGamePhase;

  const boardTiles = useMemo(generateBoardTiles, []);

  return (
    <div className="board-container">
      <div className="board">
        {boardTiles.map((row, rowIdx) => (
          <div key={rowIdx} className="board-row">
            {row.map((tile) => (
              <Tile
                key={tile}
                tile={tile}
                playerTile={playerTile}
                aiTile={aiTile}
                gamePhase={gamePhase}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
});

export default Board;