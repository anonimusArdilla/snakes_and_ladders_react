/**
 * Board Component
 *
 * Renders the game board with numbered tiles,
 * snake/ladder indicators, and player tokens.
 * Supports both single-player (from store) and multiplayer (from props).
 * Shows colored arrows — red for snakes, green for ladders.
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
 * Red curved arrows for snakes (sliding down), green curved arrows for ladders (climbing up).
 * Uses SVG cubic bezier paths positioned over the grid.
 */
const BoardArrows = memo(function BoardArrows() {
  const arrows = useMemo(() => {
    const result = [];

    // Snakes — red curved arrows from head tile to tail tile
    for (const [from, to] of Object.entries(SNAKES)) {
      const fromPos = getTilePosition(parseInt(from));
      const toPos = getTilePosition(to);
      // Percentage coordinates (0–100) for viewBox
      const x1 = fromPos.col * 10 + 5;
      const y1 = fromPos.row * 10 + 5;
      const x2 = toPos.col * 10 + 5;
      const y2 = toPos.row * 10 + 5;
      // Control point offset for a smooth organic curve
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      const dx = x2 - x1;
      const dy = y2 - y1;
      // Perpendicular offset for the control point — creates a smooth arc
      const perpDist = Math.max(Math.abs(dx), Math.abs(dy)) * 0.4;
      const cx = midX - dy * (perpDist / Math.sqrt(dx * dx + dy * dy || 1));
      const cy = midY + dx * (perpDist / Math.sqrt(dx * dx + dy * dy || 1));
      const d = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
      result.push({ d, type: 'snake' });
    }

    // Ladders — green curved arrows from bottom tile to top tile
    for (const [from, to] of Object.entries(LADDERS)) {
      const fromPos = getTilePosition(parseInt(from));
      const toPos = getTilePosition(to);
      const x1 = fromPos.col * 10 + 5;
      const y1 = fromPos.row * 10 + 5;
      const x2 = toPos.col * 10 + 5;
      const y2 = toPos.row * 10 + 5;
      // Control point offset for a smooth organic curve
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      const dx = x2 - x1;
      const dy = y2 - y1;
      // Perpendicular offset for the control point — creates a smooth arc
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
        <marker
          id="board-arrow-snake"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--tile-snake)" />
        </marker>
        <marker
          id="board-arrow-ladder"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
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
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
});

export default Board;