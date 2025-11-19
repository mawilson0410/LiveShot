# LiveShot

A basketball shooting test tracking application that allows coaches and players to record, track, and analyze shooting performance across different test types and court locations.

## Features

- **Player Management**: Create and manage player profiles with team and jersey number information
- **Test Presets**: Select different shooting test types (e.g., Classic 3PT Test, 2PT Midrange Test)
- **Live Test Tracking**: Record shots in real-time during active tests with court location tracking
- **Performance Analytics**: 
  - View accuracy and points scored over time with interactive charts
  - Per test statistics available on every test summary page
  - Track lifetime statistics and best/worst performances
- **Leaderboard**: See top performers ranked by average accuracy
- **Theme Selector**: Multiple color themes to choose from

## Tech Stack

### Frontend
- **React 19** with **TypeScript**
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** + **DaisyUI** - Styling and UI components
- **Zustand** - State management
- **Recharts** - Data visualization
- **Axios** - HTTP client

### Backend
- **Node.js** with **Express 5**
- **Neon Database** (PostgreSQL) - Serverless database
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing
- **Morgan** - HTTP request logger for debugging

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- Neon PostgreSQL database

## Setup

### Environment Variables
Import the `.env` file/create a `.env` file in the `backend` directory:

```env
PORT=3000
NODE_ENV=dev
FRONTEND_URL=https://live-shot.vercel.app/ (leave blank for development)

PGUSER='...'
PGPASSWORD='...'
PGHOST='...'
PGDATABASE='...'
```

## Development

### Start Backend Server

```bash
cd backend
npm install
npm run dev
```

The backend server will run on `http://localhost:3000`

### Start Frontend Development Server

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:5173`

## Project Structure

```
LiveShot/
├── backend/
│   ├── config/          # Database configuration
│   ├── controllers/     # Request handlers
│   ├── routes/          # API routes
│   └── server.js        # Express server entry point
└── frontend/
    ├── src/
    │   ├── components/  # React components
    │   ├── pages/       # Page components
    │   ├── services/    # API service functions
    │   ├── store/       # Zustand stores
    │   └── config/      # Configuration files
    └── public/          # Static assets
```

## API Endpoints

- `GET /api/players` - Get all players
- `GET /api/players/:id` - Get player by ID
- `GET /api/players/:id/tests` - Get player's tests
- `GET /api/players/:id/stats` - Get player statistics
- `GET /api/players/leaderboard` - Get leaderboard
- `POST /api/tests` - Create a new test
- `GET /api/tests/:id` - Get test details
- `GET /api/test-presets` - Get all test presets

This application was made by Michael Wilson, for the Cleveland Cavaliers.

