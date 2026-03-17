# HGT Ice Factory OS - Complete Codebase Brief

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Project Structure](#project-structure)
4. [Frontend Architecture](#frontend-architecture)
5. [Backend Architecture](#backend-architecture)
6. [Database Schema](#database-schema)
7. [Authentication & Security](#authentication--security)
8. [API Design & Data Flow](#api-design--data-flow)
9. [Key Components & Services](#key-components--services)
10. [Integration Points](#integration-points)
11. [Development Workflow](#development-workflow)
12. [Common Patterns & Conventions](#common-patterns--conventions)

---

## System Overview

**HGT Ice Factory OS** is a comprehensive management system for ice factory operations. It manages:
- **Sales Transactions** (Cash/Credit/Partial payments)
- **Customer Management** (Ledger, credit tracking, risk assessment)
- **Production Logging** (Daily production metrics, waste tracking)
- **Fuel Management** (Consumption tracking, efficiency monitoring)
- **Expense Management** (Categorized operational expenses)
- **Analytics & Reporting** (Dashboard metrics, daily/monthly reports)

### Core Business Logic
- Tracks customer credit balances automatically
- Calculates fuel efficiency and production metrics
- Generates alerts for low efficiency, overdue payments, credit limits
- Integrates with n8n for workflow automation
- Supports multi-currency operations (primarily SSP - South Sudanese Pound)

---

## Architecture & Tech Stack

### Frontend
- **Framework**: React 19.2.3 with TypeScript
- **Build Tool**: Vite 6.2.0
- **Styling**: Tailwind CSS (inline classes)
- **Charts**: Recharts 3.6.0
- **Icons**: Lucide React
- **State Management**: React Hooks (useState, useEffect)
- **HTTP Client**: Custom API client (`lib/api-client.ts`)

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js 4.18.2
- **Language**: TypeScript 5.3.3
- **Database**: Supabase (PostgreSQL)
- **ORM/Client**: Supabase JS Client 2.89.0
- **Validation**: Zod 3.22.4
- **PDF Generation**: pdfmake 0.3.1
- **Security**: Helmet, CORS, express-rate-limit

### Database
- **Provider**: Supabase (PostgreSQL)
- **Features Used**: 
  - Row Level Security (RLS)
  - Database Functions & Triggers
  - Views for aggregated data
  - UUID primary keys

### External Integrations
- **n8n**: Workflow automation via webhooks
- **Supabase Auth**: User authentication

---

## Project Structure

```
HGT_ICE-Factory-Os/
├── App.tsx                    # Main React application component
├── index.tsx                  # React entry point
├── index.html                 # HTML template
├── types.ts                   # Frontend TypeScript types
├── data.ts                    # Mock data (fallback)
├── utils.ts                   # Frontend utilities
├── vite.config.ts             # Vite configuration
├── package.json               # Frontend dependencies
│
├── components/                 # React components
│   ├── Auth.tsx              # Authentication UI
│   ├── Dashboard.tsx         # Main dashboard with metrics
│   ├── SalesForm.tsx         # Sales transaction form
│   ├── CustomerLedger.tsx    # Customer balance & history
│   ├── ExpenseForm.tsx        # Expense logging form
│   ├── FuelForm.tsx          # Fuel log form
│   ├── ProductionForm.tsx    # Production log form
│   ├── Reports.tsx           # Reports & analytics
│   ├── Layout.tsx            # Main layout wrapper
│   └── shared/               # Reusable UI components
│       ├── AlertBanner.tsx
│       ├── ClientSelector.tsx
│       ├── ConfirmationModal.tsx
│       ├── NotificationBell.tsx
│       ├── QuickActions.tsx
│       └── Tooltip.tsx
│
├── lib/                       # Frontend libraries
│   ├── api-client.ts         # Backend API client
│   ├── auth.ts               # Auth helpers
│   └── supabase.ts           # Supabase client (auth only)
│
├── backend/                   # Express.js backend
│   ├── src/
│   │   ├── server.ts         # Server entry point
│   │   ├── app.ts            # Express app setup
│   │   │
│   │   ├── config/           # Configuration
│   │   │   ├── env.ts        # Environment variables
│   │   │   ├── cors.ts       # CORS configuration
│   │   │   ├── supabase.ts   # Supabase clients
│   │   │   └── factory-settings.ts
│   │   │
│   │   ├── routes/           # API route definitions
│   │   │   ├── auth.routes.ts
│   │   │   ├── sales.routes.ts
│   │   │   ├── customers.routes.ts
│   │   │   ├── production.routes.ts
│   │   │   ├── fuel.routes.ts
│   │   │   ├── expenses.routes.ts
│   │   │   └── reports.routes.ts
│   │   │
│   │   ├── controllers/      # Request handlers
│   │   │   ├── sales.controller.ts
│   │   │   ├── customers.controller.ts
│   │   │   ├── production.controller.ts
│   │   │   ├── fuel.controller.ts
│   │   │   ├── expenses.controller.ts
│   │   │   └── reports.controller.ts
│   │   │
│   │   ├── services/         # Business logic layer
│   │   │   ├── sale.service.ts
│   │   │   ├── customer.service.ts
│   │   │   ├── production.service.ts
│   │   │   ├── fuel.service.ts
│   │   │   ├── expense.service.ts
│   │   │   ├── report.service.ts
│   │   │   ├── pdf-report.service.ts
│   │   │   └── webhook.service.ts
│   │   │
│   │   ├── repositories/    # Database access layer
│   │   │   ├── sale.repository.ts
│   │   │   ├── customer.repository.ts
│   │   │   ├── production.repository.ts
│   │   │   ├── fuel.repository.ts
│   │   │   ├── expense.repository.ts
│   │   │   └── report.repository.ts
│   │   │
│   │   ├── middlewares/     # Express middlewares
│   │   │   ├── auth.middleware.ts    # JWT authentication
│   │   │   ├── validate.middleware.ts # Request validation
│   │   │   ├── error.middleware.ts   # Error handling
│   │   │   └── api-secret.middleware.ts
│   │   │
│   │   ├── validators/      # Zod validation schemas
│   │   │   ├── sales.validator.ts
│   │   │   ├── customers.validator.ts
│   │   │   ├── production.validator.ts
│   │   │   ├── fuel.validator.ts
│   │   │   ├── expenses.validator.ts
│   │   │   └── reports.validator.ts
│   │   │
│   │   ├── types/           # Backend TypeScript types
│   │   │   └── index.ts
│   │   │
│   │   ├── utils/           # Backend utilities
│   │   │   └── index.ts
│   │   │
│   │   └── webhooks/        # Webhook handlers
│   │       └── n8n.webhook.ts
│   │
│   ├── package.json
│   └── tsconfig.json
│
└── database/                  # Database scripts
    ├── COMPLETE_SCHEMA.sql   # Full database schema
    ├── SETUP_GUIDE.md        # Setup instructions
    └── n8n_workflows.md      # n8n integration guide
```

---

## Frontend Architecture

### Application Flow

1. **Entry Point** (`index.tsx`)
   - Renders `<App />` component
   - Sets up React root

2. **Main App Component** (`App.tsx`)
   - **State Management**: Uses React hooks for all state
   - **Authentication Check**: Verifies Supabase auth on mount
   - **Backend Connection**: Tests backend health endpoint
   - **Data Loading**: Loads all data from backend API on initialization
   - **View Routing**: Manages current view state (DASHBOARD, NEW_SALE, etc.)
   - **Error Handling**: Displays error banners and loading states

### Key Frontend Patterns

#### 1. API Client Pattern
```typescript
// lib/api-client.ts
- Centralized HTTP client
- Automatic JWT token injection
- Standardized error handling
- Type-safe API methods for each resource
```

#### 2. Authentication Flow
```typescript
// lib/auth.ts & lib/supabase.ts
- Uses Supabase Auth for authentication
- Stores JWT token in memory
- Listens to auth state changes
- Redirects to login if not authenticated
```

#### 3. Component Structure
- **Layout Component**: Provides navigation and structure
- **Form Components**: Handle data input (SalesForm, ExpenseForm, etc.)
- **Display Components**: Show data (Dashboard, CustomerLedger, Reports)
- **Shared Components**: Reusable UI elements (AlertBanner, Tooltip, etc.)

#### 4. Data Flow
```
User Action → Form Component → API Call → Backend → Database
                                    ↓
                            Update Local State → Re-render UI
```

### Frontend State Management

- **Local State**: Each component manages its own state with `useState`
- **Shared State**: Passed down via props from `App.tsx`
- **No Global State**: No Redux/Context API for global state
- **Data Refresh**: Manual refresh by calling `loadAllData()` in App.tsx

### View States

Defined in `types.ts`:
```typescript
type ViewState = 
  | 'DASHBOARD'      // Main dashboard
  | 'NEW_SALE'       // Sales form
  | 'LOG_FUEL'       // Fuel log form
  | 'ADD_EXPENSE'    // Expense form
  | 'PRODUCTION_LOG'  // Production form
  | 'REPORTS'        // Reports view
  | 'CUSTOMERS'      // Customer ledger
```

---

## Backend Architecture

### Layered Architecture

The backend follows a **3-layer architecture**:

```
Routes → Controllers → Services → Repositories → Database
         ↓              ↓            ↓
    Validation    Business Logic   Data Access
```

#### 1. Routes Layer (`routes/`)
- Defines API endpoints
- Applies middleware (auth, validation)
- Maps HTTP methods to controller methods
- Example: `POST /api/sales` → `SalesController.createSale()`

#### 2. Controllers Layer (`controllers/`)
- Handles HTTP request/response
- Extracts data from request (body, params, query)
- Calls service layer
- Formats response in standard `ApiResponse<T>` format
- Example: `SalesController.createSale(req, res)`

#### 3. Services Layer (`services/`)
- Contains **business logic**
- Orchestrates multiple repository calls
- Validates business rules
- Triggers webhooks/notifications
- Example: `SaleService.createSale()` - validates customer, updates credit balance, triggers webhook

#### 4. Repositories Layer (`repositories/`)
- **Database access only**
- Uses Supabase client for queries
- No business logic
- Returns raw data from database
- Example: `SaleRepository.create()` - inserts into database

### Request Flow Example

```
1. HTTP Request: POST /api/sales
   ↓
2. Route: sales.routes.ts
   - Applies authenticate middleware
   - Applies validate middleware (Zod schema)
   ↓
3. Controller: SalesController.createSale()
   - Extracts saleData from req.body
   - Gets userId from req.user (set by auth middleware)
   ↓
4. Service: SaleService.createSale()
   - Validates customer exists and is active
   - Creates sale via repository
   - Updates customer credit balance if credit sale
   - Triggers n8n webhook
   ↓
5. Repository: SaleRepository.create()
   - Inserts into sales table
   - Returns created sale
   ↓
6. Response: JSON { success: true, data: sale }
```

### Middleware Stack

Applied in order:
1. **Helmet**: Security headers
2. **CORS**: Cross-origin resource sharing
3. **Rate Limiting**: 100 requests per 15 minutes per IP
4. **JSON Parser**: Parses request body
5. **Route-specific**: Auth, Validation

### Error Handling

- **Error Middleware** (`error.middleware.ts`): Catches all errors
- **AppError Class**: Custom error with code and status
- **Standard Format**: `{ success: false, message: string, code: string }`
- **HTTP Status Codes**: 400 (validation), 401 (auth), 404 (not found), 500 (server)

---

## Database Schema

### Core Tables

#### 1. `customers`
- Stores customer information
- Tracks `total_credit_due`, `credit_limit`, `risk_level`
- Calculates `days_overdue` automatically
- Indexes: phone_number, credit_due, risk_level

#### 2. `sales`
- All sales transactions
- Links to `customers` via `customer_id`
- Tracks `payment_status` (CASH/CREDIT/PARTIAL)
- Calculates `total_amount`, `balance_due`
- Indexes: customer_id, created_at, payment_status

#### 3. `payments`
- Credit payments from customers
- Links to `sales` and `customers`
- Tracks `payment_method` (CASH/BANK_TRANSFER/MOBILE_MONEY)

#### 4. `expenses`
- Operational expenses
- Categorized: FUEL, FOOD, SALARY, MAINTENANCE, UTILITIES, SUPPLIES, OTHER
- Multi-currency support

#### 5. `fuel_logs`
- Fuel consumption tracking
- Calculates `fuel_efficiency` (boxes per liter)
- Tracks `alert_level` (NORMAL/WARNING/CRITICAL)
- Links to production via date correlation

#### 6. `production_logs`
- Daily production metrics
- Tracks `quantity_produced`, `waste_blocks`, `good_blocks`
- Calculates `waste_percentage`
- Shift-based: Morning/Afternoon/Night

#### 7. `daily_metrics`
- Aggregated daily statistics
- Auto-calculated via triggers
- Includes: revenue, expenses, profit, efficiency metrics

#### 8. `alerts`
- System alerts (fuel efficiency, credit limits, overdue payments)
- Tracks `is_read`, `is_resolved`

### Database Functions & Triggers

1. **`update_customer_credit()`**: Updates customer credit balance after sale
2. **`update_credit_after_payment()`**: Reduces credit balance after payment
3. **`check_fuel_efficiency()`**: Calculates and alerts on fuel efficiency
4. **`update_daily_metrics()`**: Aggregates daily metrics at end of day

### Views

1. **`dashboard_summary`**: Aggregated dashboard data
2. **`customer_risk_summary`**: Customer risk assessment data

### Row Level Security (RLS)

- All tables have RLS enabled
- Policies restrict access based on authenticated user
- Service role key used by backend for full access

---

## Authentication & Security

### Authentication Flow

1. **Frontend**: User logs in via Supabase Auth (`components/Auth.tsx`)
2. **Supabase**: Returns JWT token
3. **Frontend**: Stores token in memory (via `lib/auth.ts`)
4. **API Calls**: Token sent in `Authorization: Bearer <token>` header
5. **Backend**: Validates token via `auth.middleware.ts`
6. **Backend**: Extracts user info and attaches to `req.user`

### Security Measures

1. **Helmet**: Security HTTP headers
2. **CORS**: Restricted to configured origins
3. **Rate Limiting**: Prevents abuse (100 req/15min)
4. **JWT Validation**: All protected routes require valid token
5. **Input Validation**: Zod schemas validate all inputs
6. **SQL Injection Protection**: Supabase client handles parameterization
7. **RLS**: Database-level access control

### User Roles

- **admin**: Full access
- **manager**: Most operations
- **staff**: Limited operations (defined in `authorize()` middleware)

---

## API Design & Data Flow

### API Structure

All APIs follow RESTful conventions:
- `GET /api/resource` - List resources
- `GET /api/resource/:id` - Get single resource
- `POST /api/resource` - Create resource
- `PUT /api/resource/:id` - Update resource (if implemented)
- `DELETE /api/resource/:id` - Delete resource (if implemented)

### Standard Response Format

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

### API Endpoints

#### Authentication
- `GET /api/auth/health` - Health check (no auth required)
- `POST /api/auth/verify` - Verify token (no auth required)

#### Sales
- `POST /api/sales` - Create sale
- `GET /api/sales` - List sales (with filters: customer_id, payment_status)
- `GET /api/sales/:id` - Get sale by ID

#### Customers
- `GET /api/customers` - List customers
- `GET /api/customers/:id` - Get customer by ID
- `GET /api/customers/:id/ledger` - Get customer ledger
- `POST /api/customers` - Create customer

#### Production
- `POST /api/production` - Create production log
- `GET /api/production` - List production logs (with date filters)

#### Fuel
- `POST /api/fuel` - Create fuel log
- `GET /api/fuel` - List fuel logs (with date filters)

#### Expenses
- `POST /api/expenses` - Create expense
- `GET /api/expenses` - List expenses (with category/date filters)

#### Reports
- `GET /api/reports/dashboard` - Dashboard metrics
- `GET /api/reports/daily` - Daily report
- `GET /api/reports/monthly` - Monthly report
- `GET /api/reports/customer/:id` - Customer report

### Data Flow Diagram

```
┌─────────────┐
│   Browser   │
│  (React)    │
└──────┬──────┘
       │ HTTP Request (JWT in header)
       ↓
┌─────────────┐
│   Express   │
│   Backend   │
└──────┬──────┘
       │
       ├─→ Auth Middleware (validate JWT)
       ├─→ Validation Middleware (Zod schema)
       ├─→ Controller (extract data)
       ├─→ Service (business logic)
       ├─→ Repository (database query)
       │
       ↓
┌─────────────┐
│  Supabase   │
│ (PostgreSQL)│
└──────┬──────┘
       │
       ├─→ Database Functions/Triggers
       ├─→ RLS Policies
       └─→ Return Data
       │
       ↓
┌─────────────┐
│   n8n       │
│  Webhook    │ (async, fire-and-forget)
└─────────────┘
```

---

## Key Components & Services

### Frontend Components

#### `App.tsx`
- **Purpose**: Main application orchestrator
- **Responsibilities**:
  - Authentication state management
  - Backend connection testing
  - Data loading and state management
  - View routing
  - Error handling

#### `Dashboard.tsx`
- **Purpose**: Main dashboard with metrics
- **Displays**: Revenue, expenses, profit, efficiency metrics, charts
- **Data Sources**: Sales, expenses, fuel logs, production logs

#### `SalesForm.tsx`
- **Purpose**: Create new sales transactions
- **Features**: Customer selection, quantity/price input, payment status
- **Validation**: Frontend validation before API call

#### `CustomerLedger.tsx`
- **Purpose**: View customer balance and transaction history
- **Displays**: Credit due, payment history, risk level

### Backend Services

#### `SaleService`
- **Business Logic**:
  - Validates customer exists and is active
  - Calculates total_amount and balance_due
  - Updates customer credit balance for credit sales
  - Triggers n8n webhook for all sales
  - Triggers high-value sale webhook (>100,000 SSP)

#### `ReportService`
- **Purpose**: Generate aggregated reports
- **Methods**: Daily, monthly, dashboard metrics
- **Calculations**: Revenue, expenses, profit, efficiency

#### `WebhookService`
- **Purpose**: Send events to n8n
- **Events**: `sale.created`, `sale.high_value`
- **Pattern**: Fire-and-forget (async, errors logged but don't fail request)

### Repository Pattern

All repositories follow the same pattern:
- Use Supabase client (`getSupabaseClient()`)
- Methods: `findAll()`, `findById()`, `create()`, `update()`, `delete()`
- Error handling via `AppError`
- Type-safe with TypeScript interfaces

---

## Integration Points

### n8n Integration

**Purpose**: Workflow automation

**Configuration**:
- `N8N_WEBHOOK_URL`: n8n webhook endpoint
- `N8N_WEBHOOK_SECRET`: Secret for webhook authentication
- `N8N_SECRET_TOKEN`: Token for webhook requests

**Events Triggered**:
1. **`sale.created`**: Every sale creation
   - Data: sale_id, customer_id, total_amount, payment_status
2. **`sale.high_value`**: Sales > 100,000 SSP
   - Data: Full sale details + customer name

**Implementation**:
- `services/webhook.service.ts`: Handles webhook calls
- Fire-and-forget pattern (doesn't block request)
- Errors logged but don't fail the main operation

### Supabase Integration

**Authentication**:
- Frontend: Uses Supabase Auth for login
- Backend: Validates JWT tokens from Supabase

**Database**:
- All data stored in Supabase PostgreSQL
- Uses Supabase JS client for queries
- Service role key for backend operations
- Anon key for frontend auth only

---

## Development Workflow

### Running the Application

1. **Install Dependencies**:
   ```bash
   npm run install:all
   ```

2. **Environment Setup**:
   - Frontend: Create `.env` with `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_BASE_URL`
   - Backend: Create `backend/.env` with all required variables (see `backend/src/config/env.ts`)

3. **Database Setup**:
   - Run `database/COMPLETE_SCHEMA.sql` in Supabase SQL Editor
   - See `database/SETUP_GUIDE.md` for details

4. **Start Development**:
   ```bash
   npm run dev  # Starts both frontend and backend
   ```
   Or separately:
   ```bash
   npm run dev:backend    # Backend only (port 3001)
   npm run dev:frontend   # Frontend only (port 3000)
   ```

### Code Organization Principles

1. **Separation of Concerns**: Each layer has a single responsibility
2. **Type Safety**: TypeScript used throughout
3. **Error Handling**: Standardized error responses
4. **Validation**: Input validation at route level (Zod)
5. **Business Logic**: Only in service layer, not in controllers/repositories

### Adding a New Feature

Example: Adding a new "Inventory" feature

1. **Database**: Add `inventory` table in schema
2. **Backend Types**: Add `Inventory` interface in `backend/src/types/index.ts`
3. **Repository**: Create `inventory.repository.ts`
4. **Service**: Create `inventory.service.ts` (business logic)
5. **Controller**: Create `inventory.controller.ts`
6. **Validator**: Create `inventory.validator.ts` (Zod schema)
7. **Routes**: Create `inventory.routes.ts` and add to `app.ts`
8. **Frontend Types**: Add `Inventory` interface in `types.ts`
9. **API Client**: Add `inventory` methods in `lib/api-client.ts`
10. **Component**: Create `InventoryForm.tsx` and `InventoryList.tsx`
11. **App.tsx**: Add view state and route to component

---

## Common Patterns & Conventions

### Naming Conventions

- **Files**: kebab-case (e.g., `sales.controller.ts`)
- **Classes**: PascalCase (e.g., `SalesController`)
- **Functions/Methods**: camelCase (e.g., `createSale`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRIES`)
- **Types/Interfaces**: PascalCase (e.g., `Sale`, `ApiResponse`)

### Error Handling Pattern

```typescript
// Service Layer
if (!customer) {
  throw new AppError('Customer not found', 'CUSTOMER_NOT_FOUND', 404);
}

// Controller Layer
try {
  const result = await service.method();
  res.status(200).json({ success: true, data: result });
} catch (error: any) {
  throw error; // Let error middleware handle it
}
```

### API Response Pattern

```typescript
// Success
{ success: true, data: T }

// Error
{ success: false, message: string, code: string }
```

### Repository Pattern

```typescript
class ResourceRepository {
  private supabase = getSupabaseClient();
  
  async findAll(limit, offset, filters): Promise<Resource[]> {
    // Build query with filters
    // Return array
  }
  
  async findById(id: string): Promise<Resource | null> {
    // Return single resource or null
  }
  
  async create(data: Partial<Resource>): Promise<Resource> {
    // Insert and return created resource
  }
}
```

### Service Pattern

```typescript
class ResourceService {
  private repo = new ResourceRepository();
  
  async createResource(data: Partial<Resource>): Promise<Resource> {
    // 1. Validate business rules
    // 2. Call repository
    // 3. Trigger side effects (webhooks, updates)
    // 4. Return result
  }
}
```

### Frontend API Call Pattern

```typescript
// In component
const handleSubmit = async (data) => {
  try {
    const result = await apiClient.resource.create(data);
    // Update local state
    setResources(prev => [result, ...prev]);
  } catch (error) {
    setError(error.message);
  }
};
```

---

## Key Files Reference

### Frontend Entry Points
- `index.tsx` - React entry point
- `App.tsx` - Main application component
- `lib/api-client.ts` - API client configuration

### Backend Entry Points
- `backend/src/server.ts` - Server startup
- `backend/src/app.ts` - Express app configuration

### Configuration
- `backend/src/config/env.ts` - Environment variables
- `backend/src/config/supabase.ts` - Supabase client setup
- `backend/src/config/cors.ts` - CORS configuration

### Database
- `database/COMPLETE_SCHEMA.sql` - Full database schema
- `database/SETUP_GUIDE.md` - Setup instructions

### Type Definitions
- `types.ts` - Frontend types
- `backend/src/types/index.ts` - Backend types

---

## Troubleshooting Guide

### Common Issues

1. **Backend Connection Failed**
   - Check if backend is running on port 3001
   - Verify `VITE_API_BASE_URL` in frontend `.env`
   - Check CORS configuration in backend

2. **Authentication Errors**
   - Verify Supabase credentials in both frontend and backend `.env`
   - Check JWT token expiration
   - Verify RLS policies in database

3. **Database Errors**
   - Check Supabase connection
   - Verify service role key is correct
   - Check table names match schema

4. **Webhook Failures**
   - Check n8n webhook URL is correct
   - Verify webhook secret/token
   - Check n8n workflow is active
   - Errors are logged but don't fail the main operation

---

## Future Enhancements (Not Yet Implemented)

- Payment processing (currently only tracking)
- Inventory management
- Multi-user role-based access control (partially implemented)
- Real-time notifications
- Export to Excel/CSV
- Mobile app
- Offline mode with sync

---

## Summary

This codebase follows a **clean, layered architecture** with clear separation between:
- **Frontend**: React components with API client
- **Backend**: Express.js with 3-layer architecture (Routes → Controllers → Services → Repositories)
- **Database**: Supabase PostgreSQL with RLS and triggers
- **Integration**: n8n webhooks for automation

Key principles:
- Type safety with TypeScript
- Standardized error handling
- Input validation at API boundary
- Business logic in service layer only
- Database access isolated in repositories
- Fire-and-forget webhooks for external integrations
