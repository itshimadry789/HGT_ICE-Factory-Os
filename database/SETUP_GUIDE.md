# HANAANO - Database & Integration Setup Guide

## Quick Start

Follow these steps to set up your complete backend infrastructure.

---

## Step 1: Supabase Setup

### 1.1 Create Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click **"New Project"**
3. Fill in:
   - **Name**: `hanaano-factory`
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to South Sudan (e.g., Frankfurt)
4. Wait for project to be created (~2 minutes)

### 1.2 Get Your Credentials

1. Go to **Settings > API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: For frontend use
   - **service_role key**: For N8N only (KEEP SECRET!)

### 1.3 Run Database Schema

1. Go to **SQL Editor** in Supabase Dashboard
2. Click **"New Query"**
3. Copy entire contents of `database/supabase_schema.sql`
4. Paste into the query editor
5. Click **"Run"** (or Cmd/Ctrl + Enter)
6. Verify all tables were created in **Table Editor**

### 1.4 Enable Realtime

1. Go to **Database > Replication**
2. Enable realtime for these tables:
   - `alerts`
   - `daily_metrics`
   - `sales`
   - `customers`

---

## Step 2: Frontend Configuration

### 2.1 Create Environment File

Create `.env` in your project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: N8N Webhook Base URL
VITE_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook
```

### 2.2 Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### 2.3 Update Package.json

Add to your dependencies if not already present:

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0"
  }
}
```

---

## Step 3: N8N Setup

### 3.1 N8N Installation Options

**Option A: N8N Cloud (Easiest)**
1. Go to [n8n.io](https://n8n.io)
2. Sign up for cloud account
3. Get your instance URL: `https://your-name.app.n8n.cloud`

**Option B: Self-Hosted (Free)**
```bash
# Using Docker
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n

# Access at http://localhost:5678
```

### 3.2 Add Supabase Credentials in N8N

1. Go to **Settings > Credentials**
2. Click **"Add Credential"**
3. Search for **"Supabase"**
4. Fill in:
   - **Host**: `https://your-project.supabase.co`
   - **Service Role Key**: Your service_role key (NOT anon key!)
5. Save

### 3.3 Import Workflows

1. Go to **Workflows**
2. Click **"Import from File"** or paste JSON
3. Import each workflow from `database/n8n_workflows.md`
4. Update credentials in each workflow
5. Activate workflows

---

## Step 4: Supabase Webhooks

### 4.1 Create Webhooks for N8N

Go to **Database > Webhooks** in Supabase:

**Webhook 1: Fuel Efficiency Monitor**
- Name: `fuel_log_webhook`
- Table: `fuel_logs`
- Events: `INSERT`
- Type: HTTP Request
- Method: POST
- URL: `https://your-n8n.com/webhook/fuel-efficiency-webhook`
- Headers: `Content-Type: application/json`

**Webhook 2: Credit Sale Monitor**
- Name: `credit_sale_webhook`
- Table: `sales`
- Events: `INSERT`
- Type: HTTP Request
- Method: POST
- URL: `https://your-n8n.com/webhook/credit-limit-webhook`
- Headers: `Content-Type: application/json`

**Webhook 3: Payment Received**
- Name: `payment_webhook`
- Table: `payments`
- Events: `INSERT`
- Type: HTTP Request
- Method: POST
- URL: `https://your-n8n.com/webhook/payment-webhook`

---

## Step 5: Testing

### 5.1 Test Database Connection

In your browser console or a test file:

```javascript
import { supabase } from './lib/supabase';

// Test connection
const { data, error } = await supabase.from('customers').select('*');
console.log('Customers:', data);
console.log('Error:', error);
```

### 5.2 Test Webhook (N8N)

1. In N8N, open your fuel efficiency workflow
2. Click **"Execute Workflow"** 
3. Send a test request using curl:

```bash
curl -X POST https://your-n8n.com/webhook/fuel-efficiency-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "INSERT",
    "table": "fuel_logs",
    "record": {
      "id": "test-123",
      "liters_added": 50,
      "boxes_produced": 30,
      "cost_per_liter": 4000,
      "total_cost": 200000
    }
  }'
```

### 5.3 Test Real-time Updates

```javascript
import { supabase } from './lib/supabase';

// Subscribe to alerts
supabase
  .channel('test')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'alerts' },
    (payload) => console.log('New alert:', payload)
  )
  .subscribe();

// Create a test alert to trigger subscription
await supabase.from('alerts').insert({
  alert_type: 'FUEL_EFFICIENCY',
  priority: 'high',
  title: 'Test Alert',
  message: 'This is a test alert'
});
```

---

## Step 6: Security Checklist

- [ ] Service Role Key is only in N8N, never in frontend
- [ ] Anon Key is used in frontend .env
- [ ] .env file is in .gitignore
- [ ] RLS policies are enabled on all tables
- [ ] N8N webhook URLs use HTTPS
- [ ] Database password is strong and saved securely

---

## Troubleshooting

### "Permission denied" errors
- Check RLS policies are created
- Verify you're using correct key (anon vs service_role)
- Check if user is authenticated

### Webhooks not firing
- Verify webhook URL is accessible from internet
- Check N8N workflow is activated
- Look at Supabase logs: Database > Logs

### Real-time not working
- Enable replication for the table
- Check browser console for connection errors
- Verify VITE_SUPABASE_URL is correct

### N8N workflow errors
- Check credentials are configured
- Verify Supabase project is accessible
- Check N8N execution logs

---

## Architecture Overview

```
[React Frontend]
     |
     | (Anon Key)
     v
[Supabase]
     |
     |-- Tables (customers, sales, expenses, etc.)
     |-- Views (dashboard_summary)
     |-- Functions & Triggers
     |-- Real-time Subscriptions
     |
     | (Webhooks)
     v
[N8N Workflows]
     |
     |-- Daily Metrics Aggregation
     |-- Fuel Efficiency Alerts
     |-- Credit Limit Monitoring
     |-- Daily Reports (Email/WhatsApp)
     |-- Payment Reminders
```

---

## Support

For issues:
1. Check Supabase Dashboard > Logs
2. Check N8N Execution History
3. Check browser developer console
4. Review this setup guide

Happy building!

