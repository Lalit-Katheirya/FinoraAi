import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { logger } from './config/logger';
import {
  apiRateLimiter,
  authRateLimiter,
} from './middleware/rateLimit.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import apiRoutes from './routes';
import authRoutes from './routes/auth.routes';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);

  app.use(
    helmet({
      // HSTS on http://localhost breaks browsers / Electron after the first API response
      hsts: env.NODE_ENV === 'production',
      // API is called cross-origin (or via SPA proxy); allow reading responses
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );
  app.use(
    cors({
      origin(origin, callback) {
        // Non-browser clients (curl, health checks) send no Origin
        if (!origin) {
          callback(null, true);
          return;
        }
        if (env.frontendOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
      credentials: true,
    })
  );
  app.use(compression());
  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  if (env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  }

  app.use(
    pinoHttp({
      logger,
      autoLogging: env.NODE_ENV !== 'test',
    })
  );

  app.use('/api/auth', authRateLimiter, authRoutes);
  app.use('/api', apiRateLimiter, apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
