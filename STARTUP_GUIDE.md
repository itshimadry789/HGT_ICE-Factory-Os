# Startup Guide - HGT Ice Factory OS

## Quick Start

Simply run from the project root:
```bash
npm run dev
```

This command will:
1. ✅ Automatically kill any processes using ports 3000 and 3001
2. ✅ Start the backend server on port 3001
3. ✅ Start the frontend server on port 3000
4. ✅ Wait for backend to be ready before starting frontend

## What Was Fixed

### 1. **CORS Configuration** (`backend/src/config/cors.ts`)
   - Now allows all localhost variants in development mode
   - Supports `localhost`, `127.0.0.1`, and `0.0.0.0` on any port
   - Better error logging for debugging

### 2. **Port Conflict Handling** (`package.json`)
   - Added `dev:kill-ports` script that automatically clears ports 3000 and 3001
   - Prevents "EADDRINUSE" errors

### 3. **Backend Error Handling** (`backend/src/server.ts`)
   - Better error messages when port is in use
   - Graceful shutdown handling
   - Uncaught exception handling

### 4. **Frontend Port Configuration** (`vite.config.ts`)
   - Set `strictPort: true` to fail fast if port is in use
   - Prevents silent port switching

## Manual Startup (Alternative)

If you prefer to start servers separately:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev:frontend-only
```

## Troubleshooting

### Port Already in Use
If you see "EADDRINUSE" errors:
```bash
# Kill processes on ports 3000 and 3001
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

### Backend Not Connecting
1. Check backend is running: `curl http://localhost:3001/api/auth/health`
2. Check frontend .env has: `VITE_API_BASE_URL=http://localhost:3001/api`
3. Check browser console for CORS errors

### Frontend Shows "Using local data"
- Backend must be running on port 3001
- Frontend must be on port 3000
- Check that `VITE_API_BASE_URL` in `.env` is correct

## Environment Variables

**Frontend** (`.env` in root):
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_BASE_URL=http://localhost:3001/api
```

**Backend** (`backend/.env`):
```
PORT=3001
NODE_ENV=development
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000
```

## Verification

After starting, verify:
1. Backend: http://localhost:3001/api/auth/health should return `{"success":true,...}`
2. Frontend: http://localhost:3000 should load without "Using local data" banner
3. Browser console should show no CORS errors
