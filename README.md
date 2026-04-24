# 🎲 Snakes & Ladders — React

A polished, modern Snakes & Ladders game with single-player (vs AI) and real-time online multiplayer.

## Quick Start

```bash
# Install
npm install

# Run everything (server + client)
npm run dev:full

# Or run separately:
node server/index.js    # Multiplayer server on :3001
npm run dev             # Vite client on :5173
```

Open **http://localhost:5173** in your browser.

## 🎮 Game Modes

### 🤖 Single Player (vs AI)
- Play against a fair AI opponent
- AI simulates natural thinking delays (800–1500ms)
- Local win/loss statistics

### 🌐 Online Multiplayer
1. Click **"🌐 Online"** on the start screen
2. Click **"Create Room"** — you get a shareable link
3. Send the link to a friend
4. They open it and join automatically
5. Play in real-time with synchronized state

**Share link format:** `http://localhost:5173?room=a1b2c3d4`

## Architecture

```
src/
├── domain/              # Pure game logic (0 dependencies, 100% testable)
│   ├── board.js         # Board config, snakes & ladders mapping, tile positions
│   ├── dice.js          # Dice rolling + seeded PRNG for deterministic tests
│   └── rules.js         # Movement, win conditions, turn resolution
│
├── store/               # Zustand state management (persisted to localStorage)
│   ├── gameStore.js     # Single-player game state + AI scheduling
│   ├── settingsStore.js # Theme, language, sound preferences
│   └── statsStore.js    # Win/loss tracking
│
├── i18n/                # Internationalization (i18next)
│   ├── index.js         # i18next configuration
│   ├── en.js            # English
│   ├── es.js            # Spanish
│   └── zh.js            # Simplified Chinese
│
├── components/          # React UI components
│   ├── Board.jsx        # 10×10 zigzag board with tokens
│   ├── Dice.jsx         # Animated dice (single + multiplayer modes)
│   ├── GameStatus.jsx   # Single-player HUD
│   ├── GameOver.jsx     # Single-player result modal
│   ├── Header.jsx       # Title bar with back/settings
│   ├── StartScreen.jsx  # Landing with mode selection
│   ├── Settings.jsx     # Theme/language/sound panel
│   ├── MultiplayerLobby.jsx    # Room create/join/waiting
│   ├── MultiplayerStatus.jsx   # Online game HUD
│   └── MultiplayerGameOver.jsx # Online result modal
│
├── hooks/
│   ├── useSound.js      # Web Audio API sound effects
│   └── useMultiplayer.js # WebSocket connection + room management
│
├── utils/
│   └── sounds.js        # Programmatic sound generation (no audio files)
│
├── App.jsx              # Root — orchestrates single/multiplayer flows
├── main.jsx             # Entry point
└── index.css            # Full stylesheet (light/dark themes, responsive)

server/
└── index.js             # WebSocket multiplayer server (authoritative)

src/__tests__/
├── domain.test.js       # 28 unit tests for game logic
└── server.test.js       # 7 tests for server protocol
```

## Layer Responsibilities

| Layer | Responsibility | Dependencies |
|-------|---------------|-------------|
| **Domain** | Pure game rules, zero side effects | None |
| **Store** | State management, persistence | Domain |
| **Hooks** | Side effects (WebSocket, audio) | Store, Domain |
| **Components** | UI rendering, user interaction | Hooks, Store |
| **Server** | Room management, move validation, state sync | Domain |

## Multiplayer Protocol

### WebSocket Messages (Client → Server)

| Type | Payload | Description |
|------|---------|-------------|
| `create_room` | — | Create a new room, become player1 |
| `join_room` | `{ roomId }` | Join existing room as player2 |
| `roll_dice` | — | Roll dice on your turn |
| `leave_room` | — | Leave current room |

### WebSocket Messages (Server → Client)

| Type | Payload | Description |
|------|---------|-------------|
| `room_created` | `{ roomId, playerId, state, players }` | Room created successfully |
| `room_joined` | `{ roomId, state, players }` | Both players now in room |
| `game_state` | `{ state }` | Updated game state after a move |
| `game_over` | `{ state, winner }` | Game finished |
| `player_left` | `{ state, message }` | Opponent disconnected |
| `error` | `{ message }` | Error occurred |

### Server-Authoritative Design

All game logic runs on the server:
- **Dice rolls** are generated server-side (prevents cheating)
- **Move validation** uses the same `domain/` rules
- **State sync** broadcasts to both players after each move
- **Room cleanup** removes stale rooms after 30 minutes

## Tech Stack

| Tool | Purpose | Why |
|------|---------|-----|
| **React 19** | UI framework | Latest concurrent features |
| **Zustand** | State management | 1KB, zero boilerplate, hooks-first |
| **i18next** | Internationalization | Industry standard, interpolation |
| **Vite** | Build tool | Fastest dev experience |
| **Express + ws** | Multiplayer server | Lightweight, battle-tested |
| **Web Audio API** | Sound effects | Zero dependencies, programmatic |
| **Vitest** | Testing | Fast, Vite-native |

## Features

- ✅ Single-player vs AI with natural delays
- ✅ Real-time online multiplayer via WebSocket
- ✅ Shareable room links (`?room=abc123`)
- ✅ Server-authoritative (anti-cheat)
- ✅ Light/dark themes (persisted)
- ✅ 3 languages: English, Spanish, Chinese
- ✅ Sound effects (dice, snake, ladder, win, lose)
- ✅ Responsive design (desktop + mobile)
- ✅ Smooth animations (dice roll, token bounce, modals)
- ✅ Local stats tracking (wins/losses)
- ✅ 35 unit tests (all passing)
