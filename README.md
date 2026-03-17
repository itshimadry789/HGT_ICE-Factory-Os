# HGT Ice Factory OS

A modern management system for ice factory operations, built with React, TypeScript, Express.js, and Supabase.

## Features

- **Sales Management**: Process sales transactions with cash or credit options
- **Customer Ledger**: Track customer balances and payment history
- **Production Logging**: Record daily production metrics
- **Fuel Tracking**: Monitor fuel consumption and efficiency
- **Expense Management**: Log and categorize operational expenses
- **Dashboard Analytics**: Real-time metrics and visualizations
- **Backend API**: RESTful API with business logic and authentication
- **n8n Integration**: Automated workflows triggered by business events

## Tech Stack

### Frontend
- React + TypeScript
- Vite
- Tailwind CSS

### Backend
- Express.js + TypeScript
- Supabase (PostgreSQL)
- n8n (Workflow Automation)

## Architecture

```
Frontend (React) → Backend API (Express) → Supabase Database → n8n Automation
```

The frontend communicates with the backend REST API, which handles all business logic, authentication, and database operations.

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account and project
- Backend server (see `backend/README.md`)

### Installation

#### Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```env
# Supabase (for authentication)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend API
VITE_API_BASE_URL=http://localhost:3001/api
```

3. Start the development server:
```bash
npm run dev
```

#### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the `backend/` directory:
```env
PORT=3001
NODE_ENV=development

SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_ANON_KEY=your_supabase_anon_key

N8N_WEBHOOK_URL=http://localhost:5678/webhook
N8N_WEBHOOK_SECRET=your_n8n_webhook_secret

CORS_ORIGIN=http://localhost:3000
```

4. Set up the database:
   - Run `database/supabase_schema.sql` in your Supabase SQL Editor
   - See `database/SETUP_GUIDE.md` for detailed instructions

5. Start the backend server:
```bash
npm run dev
```

#### Running the Application

1. Start the backend server (in `backend/` directory):
```bash
cd backend && npm run dev
```

2. Start the frontend (in root directory):
```bash
npm run dev
```

3. Open http://localhost:3000 in your browser

**Note**: The backend must be running for the frontend to work properly. The frontend will fall back to local data if the backend is unavailable.

## Project Structure

```
├── components/          # React components
│   ├── shared/         # Reusable UI components
│   └── ...             # Feature-specific components
├── backend/            # Express.js backend API
│   ├── src/
│   │   ├── routes/     # API route definitions
│   │   ├── controllers/# Request handlers
│   │   ├── services/   # Business logic
│   │   ├── repositories/# Database access
│   │   └── ...
│   └── ...
├── database/           # SQL scripts and setup guides
├── lib/                # API client and utilities
│   ├── api-client.ts  # Backend API client
│   ├── auth.ts        # Authentication helpers
│   └── supabase.ts    # Supabase client (auth only)
├── types.ts            # TypeScript type definitions
└── App.tsx             # Main application component
```

## Documentation

- `backend/README.md` - Backend API documentation
- `database/SETUP_GUIDE.md` - Database setup instructions
- `database/n8n_workflows.md` - N8N workflow integration guide

## License

Private project - All rights reserved
