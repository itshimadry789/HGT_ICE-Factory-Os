import { CorsOptions } from 'cors';
import { config } from './env';

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // In development mode, allow all localhost origins (any port)
    if (config.nodeEnv === 'development') {
      // Allow requests without origin (like Postman, curl)
      if (!origin) {
        callback(null, true);
        return;
      }
      
      // Allow all localhost variants in development
      const localhostPatterns = [
        /^http:\/\/localhost(:\d+)?$/,
        /^http:\/\/127\.0\.0\.1(:\d+)?$/,
        /^http:\/\/0\.0\.0\.0(:\d+)?$/,
      ];
      
      if (localhostPatterns.some(pattern => pattern.test(origin))) {
        callback(null, true);
        return;
      }
    }
    
    // Build allowed origins list from config
    const allowedOrigins: string[] = [];
    
    if (config.frontendUrl) {
      allowedOrigins.push(config.frontendUrl);
    }
    
    if (config.corsOrigin) {
      const additionalOrigins = config.corsOrigin.split(',').map(o => o.trim()).filter(o => o);
      allowedOrigins.push(...additionalOrigins);
    }
    
    // Check if origin is in allowed list
    if (origin && allowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (!origin) {
      // Allow requests without origin in any mode (server-to-server)
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}. Allowed: ${allowedOrigins.join(', ')}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

