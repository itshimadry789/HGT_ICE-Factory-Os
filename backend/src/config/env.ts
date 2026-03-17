import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  port: number;
  nodeEnv: string;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  supabaseAnonKey: string;
  n8nWebhookUrl: string;
  n8nWebhookSecret: string;
  n8nSecretToken: string;
  internalApiSecret: string;
  corsOrigin: string;
  frontendUrl: string;
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  // Only throw error if value is undefined AND no default was provided
  // Allow empty string as a valid default value
  if (value === undefined && defaultValue === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  // Return value if it exists (even if empty string), otherwise return default
  return value !== undefined ? value : (defaultValue || '');
}

export const config: EnvConfig = {
  port: parseInt(getEnvVar('PORT', '3001'), 10),
  nodeEnv: getEnvVar('NODE_ENV', 'development'),
  supabaseUrl: getEnvVar('SUPABASE_URL'),
  supabaseServiceRoleKey: getEnvVar('SUPABASE_SERVICE_ROLE_KEY'),
  supabaseAnonKey: getEnvVar('SUPABASE_ANON_KEY'),
  // n8n is optional - allow empty string if not configured
  n8nWebhookUrl: getEnvVar('N8N_WEBHOOK_URL', ''),
  n8nWebhookSecret: getEnvVar('N8N_WEBHOOK_SECRET', ''),
  n8nSecretToken: getEnvVar('N8N_SECRET_TOKEN', ''),
  internalApiSecret: getEnvVar('INTERNAL_API_SECRET', ''),
  corsOrigin: getEnvVar('CORS_ORIGIN', 'http://localhost:3000'),
  frontendUrl: getEnvVar('FRONTEND_URL', 'http://localhost:3000'),
};

export default config;

