# PoliTrack AI

A political intelligence and campaign management platform built as a SaaS system with multi-tenant isolation.

## Architecture

- **Frontend**: React 19 + TypeScript, Tailwind CSS 4, Vite 6
- **Backend**: Express.js server (`server.ts`) that serves both the API and the Vite frontend in dev mode
- **Python Service**: FastAPI (`main.py`) for analytics, VPI calculations, and bulk voter data processing
- **Database**: Firebase Firestore (primary), SQLite/PostgreSQL via SQLAlchemy (Python analytics)
- **Auth**: Firebase Auth + custom JWT-based multi-tenant isolation
- **AI**: Google Gemini AI for speech/content generation
- **Maps**: Leaflet + Mapbox GL for GIS features
- **Offline**: IndexedDB via `idb` for offline-first volunteer data collection

## Key Features

- Multi-tenancy with `X-Tenant-ID` header and JWT verification
- Offline-first volunteer registration with background sync
- Victory Probability Index (VPI) analytics engine
- Geo-fencing for volunteer activity monitoring
- War Room: real-time TPS result monitoring
- WebSocket-based real-time communication
- Global toast notification system (`src/components/Toast.tsx`)
- Axios API service with 401 auto-redirect (`src/services/api.ts`)
- Profile edit modal in TopBar (PUT /api/users/me)
- Logout with localStorage/sessionStorage clear
- Full loading states on all form submissions and async actions
- Edit volunteer modal (PATCH /api/users/:id)

## Development

```bash
npm install
pip install bcrypt
npm run dev
```

Server runs on **port 5000** serving both the Express API and the Vite React frontend.

## Default Admin Credentials (PostgreSQL users table)

Auto-created on first startup if the `users` table is empty:
- **Phone:** `08123456789`
- **Password:** `Admin123(ChangeMe)` (bcrypt hashed)
- **Role:** Admin

## Package Manager

npm (with `package-lock.json`)

## Environment Variables

- `GEMINI_API_KEY` - Google Gemini AI API key
- `JWT_SECRET` - JWT signing secret (defaults to a dev value)
- `PORT` - Server port (defaults to 5000)
- `NODE_ENV` - Set to `production` for production mode

## Deployment

Configured for autoscale deployment with:
- Build: `npm run build`
- Run: `node --experimental-strip-types server.ts`

In production, Express serves the static Vite build from the `dist/` directory.

## Project Structure

```
server.ts          - Main Express + Vite server
main.py            - Python FastAPI analytics server
src/
  App.tsx          - Main React app (role switcher: Kandidat, Koorcam, Relawan, Data Entry)
  components/      - Dashboard components (VictoryDashboard, LogisticsMap, etc.)
  services/        - Client-side services (IndexedDB, sync manager)
  lib/             - Validation schemas (Zod)
  firebase.ts      - Firebase client config
prisma/            - Database migrations
firebase-applet-config.json  - Firebase project config
```
