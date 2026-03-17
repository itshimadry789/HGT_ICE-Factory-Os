import { config } from '../config/env';

export async function notifyN8n(event: string, data: any): Promise<void> {
  // Gracefully handle missing n8n configuration - don't fail if not set up
  if (!config.n8nWebhookUrl || config.n8nWebhookUrl === '' || config.nodeEnv === 'test') {
    console.log(`[n8n webhook] ${event}:`, data, '(n8n not configured - this is OK)');
    return;
  }

  try {
    // Create AbortController for timeout (compatible with all Node versions)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(config.n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.n8nWebhookSecret ? { 'X-Webhook-Secret': config.n8nWebhookSecret } : {}),
      },
      body: JSON.stringify({
        event,
        data,
        timestamp: new Date().toISOString(),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[n8n webhook] Failed to notify n8n: ${response.statusText} (this is non-critical)`);
    } else {
      console.log(`[n8n webhook] Successfully notified n8n: ${event}`);
    }
  } catch (error: any) {
    // Don't throw - n8n webhooks are non-critical
    if (error.name === 'AbortError') {
      console.warn(`[n8n webhook] Timeout notifying n8n for event: ${event} (this is non-critical)`);
    } else {
      console.warn(`[n8n webhook] Error notifying n8n: ${error.message} (this is non-critical)`);
    }
  }
}

