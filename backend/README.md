# HGT Ice Factory OS - Backend API

Production-ready Express.js + TypeScript backend following clean architecture principles.

## Architecture

```
Route → Controller → Service → Repository → Supabase
```

### Layers

- **Routes**: API endpoint definitions
- **Controllers**: HTTP request/response handling
- **Services**: Business logic
- **Repositories**: Database access only
- **Validators**: Request validation with Zod
- **Middlewares**: Authentication, validation, error handling

## Setup

### Prerequisites

- Node.js 18+
- Supabase account and project
- n8n instance (optional, for automation)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```env
PORT=3001
NODE_ENV=development

SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_ANON_KEY=your_supabase_anon_key

FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000

N8N_WEBHOOK_URL=http://localhost:5678/webhook
N8N_WEBHOOK_SECRET=your_n8n_webhook_secret
N8N_SECRET_TOKEN=your_n8n_secret_token
```

3. Build the project:
```bash
npm run build
```

4. Start the server:
```bash
npm start
```

For development with hot reload:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `GET /api/auth/health` - Health check
- `POST /api/auth/verify` - Verify JWT token

### Sales
- `POST /api/sales` - Create a sale
- `GET /api/sales` - Get all sales
- `GET /api/sales/:id` - Get sale by ID

### Customers
- `POST /api/customers` - Create a customer
- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get customer by ID
- `GET /api/customers/:id/ledger` - Get customer ledger

### Production
- `POST /api/production` - Create production log
- `GET /api/production` - Get production logs

### Fuel
- `POST /api/fuel` - Create fuel log
- `GET /api/fuel` - Get fuel logs

### Expenses
- `POST /api/expenses` - Create expense
- `GET /api/expenses` - Get expenses

### Reports
- `GET /api/reports/daily` - Get daily report
- `GET /api/reports/monthly` - Get monthly report
- `GET /api/reports/dashboard` - Get dashboard summary

## Authentication

All endpoints (except `/api/auth/health` and `/api/auth/verify`) require authentication.

Include JWT token in Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Error Response Format

All errors follow this format:
```json
{
  "success": false,
  "message": "Human readable error",
  "code": "ERROR_CODE"
}
```

## Success Response Format

All successful responses follow this format:
```json
{
  "success": true,
  "data": { ... }
}
```

## Business Rules

### Sales
- Credit sales automatically update customer balance
- n8n webhook is triggered on sale creation

### Production
- Waste percentage is calculated automatically
- n8n webhook is triggered on production log creation

### Expenses
- n8n webhook is triggered on expense creation

### Fuel Logs
- Fuel efficiency is calculated automatically
- Alert levels are set based on efficiency thresholds

## n8n Integration

The backend sends webhooks to n8n for:
- Sale created (all sales)
- Sale high value (sales > 100,000)
- Fuel logged

Configure `N8N_WEBHOOK_URL` and `N8N_SECRET_TOKEN` in your `.env` file. The webhook service uses a "fire and forget" approach to ensure n8n being down doesn't affect the application.

## Database

Uses Supabase (PostgreSQL) with:
- Service Role key for backend operations
- Row Level Security (RLS) enabled
- SQL views for read-heavy operations

## Development

- Type checking: `npm run type-check`
- Build: `npm run build`
- Dev mode: `npm run dev`

## Deployment

Recommended platforms:
- Railway
- Render
- Fly.io

Set environment variables in your deployment platform.

