import { config } from '../config/env';

export class WebhookService {
  /**
   * Notify n8n webhook with event and payload
   * This is a "fire and forget" operation - errors are logged but don't throw
   * to ensure n8n being down doesn't crash the application
   */
  async notifyN8n(event: string, payload: any): Promise<void> {
    // Gracefully handle missing n8n configuration - don't fail if not set up
    if (!config.n8nWebhookUrl || config.n8nWebhookUrl === '' || config.nodeEnv === 'test') {
      console.log(`[WebhookService] ${event}:`, payload, '(n8n not configured - this is OK)');
      return;
    }

    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      // Prepare headers with secret token for authentication
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add secret token if configured
      if (config.n8nSecretToken) {
        headers['X-Webhook-Secret'] = config.n8nSecretToken;
      }

      // Also include legacy webhook secret if present (for backward compatibility)
      if (config.n8nWebhookSecret) {
        headers['X-Webhook-Secret-Legacy'] = config.n8nWebhookSecret;
      }

      const response = await fetch(config.n8nWebhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          event,
          data: payload,
          timestamp: new Date().toISOString(),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`[WebhookService] Failed to notify n8n: ${response.statusText} (this is non-critical)`);
      } else {
        console.log(`[WebhookService] Successfully notified n8n: ${event}`);
      }
    } catch (error: any) {
      // Don't throw - n8n webhooks are non-critical
      if (error.name === 'AbortError') {
        console.warn(`[WebhookService] Timeout notifying n8n for event: ${event} (this is non-critical)`);
      } else {
        console.warn(`[WebhookService] Error notifying n8n: ${error.message} (this is non-critical)`);
      }
    }
  }
}

// Export singleton instance for convenience
export const webhookService = new WebhookService();
