# Notes
- The application fully made by AI Agents.
  
# Daily Productivity Tracker

A desktop productivity application built with React, Electron, and SQLite.

## Features

- ✓ Daily task management (todos)
- ✓ Work sessions timer
- ✓ Goals tracking
- ✓ Habits tracking with daily logs
- ✓ Reports and analytics
- ✓ Offline-first with local SQLite database
- ✓ Cross-platform (Windows, macOS, Linux)

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm

### Development

Start the development app with both Vite dev server and API server:

```bash
npm run dev:electron
```

This will:
1. Build the Electron main process
2. Start the Vite dev server (port 5173) for the React frontend
3. Start the Express API server (port 5000)
4. Open the Electron app with DevTools enabled

### Production Build

Build the app for production:

```bash
npm run build
```

### Web-only Development

To run just the web version without Electron:

```bash
npx cross-env NODE_ENV=development tsx server/index.ts
```

Then visit: http://localhost:5000

## Project Structure

```
├── client/              # React frontend (Vite)
├── server/              # Express API server
├── shared/              # Shared types and schemas
├── electron/            # Electron main process and preload
├── script/              # Build scripts
└── data/                # Local SQLite database (auto-created)
```

## Database

- Uses local SQLite database (`data/database.sqlite`)
- Auto-creates tables on first run
- Completely offline - no external database required

## Architecture

- **Frontend**: React 18 + Vite + TailwindCSS + Shadcn UI components
- **Backend**: Express.js + Drizzle ORM
- **Database**: SQLite with better-sqlite3
- **Desktop**: Electron for cross-platform desktop app
- **State Management**: TanStack React Query for server state


