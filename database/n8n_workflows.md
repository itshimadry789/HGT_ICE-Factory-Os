# HANAANO - N8N Workflow Integration Guide

## Overview

This document outlines the N8N automation workflows for the HANAANO Ice Factory Management System. These workflows automate critical business processes including alerts, reports, and data synchronization.

---

## Prerequisites

### 1. Supabase Setup
- Create a Supabase project
- Run the `supabase_schema.sql` to create all tables
- Get your credentials:
  - **Project URL**: `https://your-project.supabase.co`
  - **Anon Key**: For frontend use
  - **Service Role Key**: For N8N (full access)

### 2. N8N Setup
- Self-hosted N8N or N8N Cloud account
- Create the following credentials in N8N:
  - **Supabase**: Project URL + Service Role Key
  - **Twilio/WhatsApp** (optional): For SMS/WhatsApp notifications
  - **SMTP/Email** (optional): For email reports

---

## Workflow 1: Daily Metrics Aggregation

**Purpose**: Calculate and store daily business metrics at end of each day.

**Trigger**: Schedule (Cron) - Every day at 11:59 PM

### Workflow Steps:

```
[Schedule Trigger] 
    -> [Supabase: Get Today's Sales]
    -> [Supabase: Get Today's Fuel Logs]
    -> [Supabase: Get Today's Expenses]
    -> [Supabase: Get Today's Production]
    -> [Code: Calculate Metrics]
    -> [Supabase: Upsert Daily Metrics]
    -> [IF: Anomalies Detected]
        -> [Create Alert]
```

### N8N JSON (Import this):

```json
{
  "name": "HANAANO - Daily Metrics",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "cronExpression",
              "expression": "59 23 * * *"
            }
          ]
        }
      },
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "position": [250, 300]
    },
    {
      "parameters": {
        "operation": "getAll",
        "tableId": "sales",
        "filters": {
          "conditions": [
            {
              "keyName": "created_at",
              "keyValue": "={{ $today.toISODate() }}"
            }
          ]
        }
      },
      "name": "Get Today Sales",
      "type": "n8n-nodes-base.supabase",
      "position": [450, 300],
      "credentials": {
        "supabaseApi": {
          "id": "YOUR_CREDENTIAL_ID",
          "name": "Supabase"
        }
      }
    },
    {
      "parameters": {
        "jsCode": "// Calculate daily metrics\nconst sales = $input.all();\n\nconst totalRevenue = sales.reduce((sum, s) => sum + (s.json.total_amount || 0), 0);\nconst cashRevenue = sales.filter(s => s.json.payment_status === 'CASH')\n  .reduce((sum, s) => sum + (s.json.total_amount || 0), 0);\nconst totalBlocks = sales.reduce((sum, s) => sum + (s.json.quantity_blocks || 0), 0);\n\nreturn [{\n  json: {\n    metric_date: new Date().toISOString().split('T')[0],\n    total_revenue: totalRevenue,\n    cash_revenue: cashRevenue,\n    credit_revenue: totalRevenue - cashRevenue,\n    total_sales_count: sales.length,\n    total_blocks_sold: totalBlocks\n  }\n}];"
      },
      "name": "Calculate Metrics",
      "type": "n8n-nodes-base.code",
      "position": [650, 300]
    },
    {
      "parameters": {
        "operation": "upsert",
        "tableId": "daily_metrics",
        "conflictColumns": ["metric_date"]
      },
      "name": "Save Metrics",
      "type": "n8n-nodes-base.supabase",
      "position": [850, 300]
    }
  ],
  "connections": {
    "Schedule Trigger": {
      "main": [
        [{ "node": "Get Today Sales", "type": "main", "index": 0 }]
      ]
    },
    "Get Today Sales": {
      "main": [
        [{ "node": "Calculate Metrics", "type": "main", "index": 0 }]
      ]
    },
    "Calculate Metrics": {
      "main": [
        [{ "node": "Save Metrics", "type": "main", "index": 0 }]
      ]
    }
  }
}
```

---

## Workflow 2: Fuel Efficiency Alert

**Purpose**: Monitor fuel logs and send alerts when efficiency is abnormal.

**Trigger**: Supabase Webhook (on fuel_logs INSERT)

### Workflow Steps:

```
[Webhook: New Fuel Log]
    -> [Code: Calculate Efficiency]
    -> [IF: Efficiency > 1.2 L/block]
        -> [Supabase: Create Alert]
        -> [Send WhatsApp/SMS to Manager]
    -> [ELSE]
        -> [No Action]
```

### N8N JSON:

```json
{
  "name": "HANAANO - Fuel Efficiency Alert",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "fuel-efficiency-webhook",
        "responseMode": "responseNode"
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300]
    },
    {
      "parameters": {
        "jsCode": "const data = $input.first().json.record;\nconst normalEfficiency = 1.1;\n\nlet efficiency = 0;\nlet variance = 0;\nlet isAbnormal = false;\n\nif (data.boxes_produced > 0) {\n  efficiency = data.liters_added / data.boxes_produced;\n  variance = ((efficiency - normalEfficiency) / normalEfficiency) * 100;\n  isAbnormal = efficiency > 1.2;\n}\n\nreturn [{\n  json: {\n    ...data,\n    calculated_efficiency: efficiency.toFixed(3),\n    variance_percent: variance.toFixed(1),\n    is_abnormal: isAbnormal,\n    expected_liters: (data.boxes_produced * normalEfficiency).toFixed(0),\n    wasted_liters: (data.liters_added - (data.boxes_produced * normalEfficiency)).toFixed(0)\n  }\n}];"
      },
      "name": "Calculate Efficiency",
      "type": "n8n-nodes-base.code",
      "position": [450, 300]
    },
    {
      "parameters": {
        "conditions": {
          "boolean": [
            {
              "value1": "={{ $json.is_abnormal }}",
              "value2": true
            }
          ]
        }
      },
      "name": "Is Abnormal?",
      "type": "n8n-nodes-base.if",
      "position": [650, 300]
    },
    {
      "parameters": {
        "operation": "create",
        "tableId": "alerts",
        "fieldsUi": {
          "fieldValues": [
            { "fieldName": "alert_type", "fieldValue": "FUEL_EFFICIENCY" },
            { "fieldName": "priority", "fieldValue": "high" },
            { "fieldName": "title", "fieldValue": "Abnormal Fuel Consumption Detected" },
            { "fieldName": "message", "fieldValue": "={{ 'Fuel efficiency is ' + $json.variance_percent + '% above normal. Expected: ' + $json.expected_liters + 'L, Actual: ' + $json.liters_added + 'L, Wasted: ' + $json.wasted_liters + 'L' }}" },
            { "fieldName": "related_entity_type", "fieldValue": "fuel_log" },
            { "fieldName": "related_entity_id", "fieldValue": "={{ $json.id }}" }
          ]
        }
      },
      "name": "Create Alert",
      "type": "n8n-nodes-base.supabase",
      "position": [850, 200]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ JSON.stringify({ success: true, alert_created: $json.is_abnormal }) }}"
      },
      "name": "Respond",
      "type": "n8n-nodes-base.respondToWebhook",
      "position": [1050, 300]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{ "node": "Calculate Efficiency", "type": "main", "index": 0 }]]
    },
    "Calculate Efficiency": {
      "main": [[{ "node": "Is Abnormal?", "type": "main", "index": 0 }]]
    },
    "Is Abnormal?": {
      "main": [
        [{ "node": "Create Alert", "type": "main", "index": 0 }],
        [{ "node": "Respond", "type": "main", "index": 0 }]
      ]
    },
    "Create Alert": {
      "main": [[{ "node": "Respond", "type": "main", "index": 0 }]]
    }
  }
}
```

### Setting up Supabase Webhook:

In Supabase Dashboard:
1. Go to **Database > Webhooks**
2. Create new webhook:
   - **Name**: `fuel_log_webhook`
   - **Table**: `fuel_logs`
   - **Events**: `INSERT`
   - **URL**: Your N8N webhook URL
   - **Method**: POST

---

## Workflow 3: Credit Limit Alert

**Purpose**: Alert when a customer exceeds their credit limit.

**Trigger**: Supabase Webhook (on sales INSERT where payment_status = 'CREDIT')

### Workflow Steps:

```
[Webhook: New Credit Sale]
    -> [Supabase: Get Customer]
    -> [Code: Check Credit Limit]
    -> [IF: Over Limit]
        -> [Create Alert]
        -> [Send Notification]
    -> [Update Customer Risk Level]
```

### N8N JSON:

```json
{
  "name": "HANAANO - Credit Limit Monitor",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "credit-limit-webhook"
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300]
    },
    {
      "parameters": {
        "operation": "get",
        "tableId": "customers",
        "id": "={{ $json.record.customer_id }}"
      },
      "name": "Get Customer",
      "type": "n8n-nodes-base.supabase",
      "position": [450, 300]
    },
    {
      "parameters": {
        "jsCode": "const customer = $input.first().json;\nconst sale = $('Webhook').first().json.record;\n\nconst newBalance = customer.total_credit_due + sale.total_amount;\nconst isOverLimit = newBalance > customer.credit_limit;\nconst utilizationPercent = (newBalance / customer.credit_limit * 100).toFixed(1);\n\nlet riskLevel = 'LOW';\nif (isOverLimit) riskLevel = 'CRITICAL';\nelse if (utilizationPercent > 80) riskLevel = 'HIGH';\nelse if (utilizationPercent > 50) riskLevel = 'MEDIUM';\n\nreturn [{\n  json: {\n    customer_id: customer.id,\n    customer_name: customer.name,\n    customer_phone: customer.phone_number,\n    current_balance: customer.total_credit_due,\n    sale_amount: sale.total_amount,\n    new_balance: newBalance,\n    credit_limit: customer.credit_limit,\n    is_over_limit: isOverLimit,\n    utilization_percent: utilizationPercent,\n    risk_level: riskLevel\n  }\n}];"
      },
      "name": "Check Credit",
      "type": "n8n-nodes-base.code",
      "position": [650, 300]
    },
    {
      "parameters": {
        "conditions": {
          "boolean": [
            {
              "value1": "={{ $json.is_over_limit }}",
              "value2": true
            }
          ]
        }
      },
      "name": "Over Limit?",
      "type": "n8n-nodes-base.if",
      "position": [850, 300]
    },
    {
      "parameters": {
        "operation": "create",
        "tableId": "alerts",
        "fieldsUi": {
          "fieldValues": [
            { "fieldName": "alert_type", "fieldValue": "CREDIT_LIMIT" },
            { "fieldName": "priority", "fieldValue": "high" },
            { "fieldName": "title", "fieldValue": "Credit Limit Exceeded" },
            { "fieldName": "message", "fieldValue": "={{ $json.customer_name + ' has exceeded their credit limit. Balance: ' + $json.new_balance + ' SSP (Limit: ' + $json.credit_limit + ' SSP)' }}" },
            { "fieldName": "related_entity_type", "fieldValue": "customer" },
            { "fieldName": "related_entity_id", "fieldValue": "={{ $json.customer_id }}" }
          ]
        }
      },
      "name": "Create Alert",
      "type": "n8n-nodes-base.supabase",
      "position": [1050, 200]
    },
    {
      "parameters": {
        "operation": "update",
        "tableId": "customers",
        "id": "={{ $json.customer_id }}",
        "fieldsUi": {
          "fieldValues": [
            { "fieldName": "risk_level", "fieldValue": "={{ $json.risk_level }}" }
          ]
        }
      },
      "name": "Update Risk Level",
      "type": "n8n-nodes-base.supabase",
      "position": [1050, 400]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{ "node": "Get Customer", "type": "main", "index": 0 }]]
    },
    "Get Customer": {
      "main": [[{ "node": "Check Credit", "type": "main", "index": 0 }]]
    },
    "Check Credit": {
      "main": [[{ "node": "Over Limit?", "type": "main", "index": 0 }]]
    },
    "Over Limit?": {
      "main": [
        [{ "node": "Create Alert", "type": "main", "index": 0 }],
        [{ "node": "Update Risk Level", "type": "main", "index": 0 }]
      ]
    },
    "Create Alert": {
      "main": [[{ "node": "Update Risk Level", "type": "main", "index": 0 }]]
    }
  }
}
```

---

## Workflow 4: Daily Report Email/WhatsApp

**Purpose**: Send daily business summary to owner/manager.

**Trigger**: Schedule (Cron) - Every day at 6:00 AM

### Workflow Steps:

```
[Schedule: 6 AM Daily]
    -> [Supabase: Get Yesterday's Metrics]
    -> [Supabase: Get Unread Alerts]
    -> [Supabase: Get Overdue Customers]
    -> [Code: Format Report]
    -> [Send Email/WhatsApp]
```

### Message Template:

```
HANAANO Daily Report - {{ date }}
================================

REVENUE
- Total: {{ total_revenue }} SSP
- Cash: {{ cash_revenue }} SSP  
- Credit: {{ credit_revenue }} SSP

PRODUCTION
- Blocks Sold: {{ blocks_sold }}
- Blocks Produced: {{ blocks_produced }}
- Waste: {{ waste_blocks }} ({{ waste_percent }}%)

EXPENSES
- Fuel: {{ fuel_cost }} SSP
- Other: {{ other_expenses }} SSP
- Total: {{ total_expenses }} SSP

PROFIT
- Gross: {{ gross_profit }} SSP
- Net Cash: {{ net_liquidity }} SSP

ALERTS ({{ alert_count }})
{{ alerts_list }}

OVERDUE CUSTOMERS ({{ overdue_count }})
{{ overdue_list }}
```

---

## Workflow 5: Overdue Payment Reminder

**Purpose**: Send automated reminders to customers with overdue payments.

**Trigger**: Schedule - Every Monday at 9:00 AM

### Workflow Steps:

```
[Schedule: Monday 9 AM]
    -> [Supabase: Get Overdue Customers (>30 days)]
    -> [Loop: For Each Customer]
        -> [Send WhatsApp Reminder]
        -> [Log Reminder Sent]
```

### WhatsApp Message Template:

```
Assalamu Alaikum {{ customer_name }},

This is a friendly reminder from HANAANO Ice Factory.

Your current balance is: {{ balance }} SSP
Last payment received: {{ last_payment_date }}
Days overdue: {{ days_overdue }}

Please visit us to settle your account at your earliest convenience.

Thank you for your business!
HANAANO Ice Factory
```

---

## Workflow 6: Real-time Dashboard Updates

**Purpose**: Push real-time updates to the frontend dashboard.

**Trigger**: Supabase Webhook (on sales, fuel_logs, expenses INSERT)

### Workflow Steps:

```
[Webhook: New Transaction]
    -> [Supabase: Get Updated Metrics]
    -> [Supabase Realtime: Broadcast to channel 'dashboard']
```

Note: For real-time updates, you can also use Supabase Realtime directly in your React app without N8N.

---

## Setting Up Supabase Webhooks

For each workflow that uses webhooks, create a webhook in Supabase:

### 1. Go to Database > Webhooks in Supabase Dashboard

### 2. Create webhooks for:

| Name | Table | Events | N8N Webhook URL |
|------|-------|--------|-----------------|
| `fuel_log_webhook` | `fuel_logs` | INSERT | `https://your-n8n.com/webhook/fuel-efficiency-webhook` |
| `credit_sale_webhook` | `sales` | INSERT | `https://your-n8n.com/webhook/credit-limit-webhook` |
| `payment_webhook` | `payments` | INSERT | `https://your-n8n.com/webhook/payment-webhook` |

### 3. Webhook Payload Configuration:

Supabase sends webhooks in this format:
```json
{
  "type": "INSERT",
  "table": "sales",
  "record": {
    "id": "uuid",
    "customer_id": "uuid",
    "total_amount": 250000,
    "payment_status": "CREDIT",
    ...
  },
  "schema": "public",
  "old_record": null
}
```

---

## Environment Variables

Create a `.env` file for your frontend:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional: For direct N8N triggers from frontend
VITE_N8N_WEBHOOK_URL=https://your-n8n.com/webhook
```

---

## Frontend Integration

### Supabase Client Setup

Create `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)
```

### Real-time Subscriptions

```typescript
// Subscribe to alerts
supabase
  .channel('alerts')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'alerts' },
    (payload) => {
      console.log('New alert:', payload.new)
      // Update UI
    }
  )
  .subscribe()

// Subscribe to daily metrics
supabase
  .channel('metrics')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'daily_metrics' },
    (payload) => {
      console.log('Metrics updated:', payload.new)
      // Refresh dashboard
    }
  )
  .subscribe()
```

---

## Testing Checklist

- [ ] All tables created successfully in Supabase
- [ ] RLS policies are working correctly
- [ ] Triggers fire on INSERT/UPDATE
- [ ] N8N webhooks are accessible
- [ ] Daily metrics calculation is accurate
- [ ] Fuel efficiency alerts trigger correctly
- [ ] Credit limit alerts work
- [ ] Email/WhatsApp notifications send
- [ ] Real-time updates work in frontend

---

## Security Notes

1. **Never expose Service Role Key** in frontend code
2. Use **Anon Key** for frontend, **Service Role Key** only for N8N
3. Configure **RLS policies** properly for multi-user scenarios
4. Use **HTTPS** for all webhook URLs
5. Consider adding **webhook secrets** for verification

