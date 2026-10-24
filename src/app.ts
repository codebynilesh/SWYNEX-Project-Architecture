import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middlewares/error-handler';
import { authRouter } from './modules/auth/auth.routes';
import { projectsRouter } from './modules/projects/projects.routes';
import { tasksRouter } from './modules/tasks/tasks.routes';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));
  app.use(
    cors({
      origin:
        env.CORS_ORIGIN === '*'
          ? true
          : env.CORS_ORIGIN.split(',')
              .map((origin) => origin.trim())
              .filter(Boolean),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/projects', projectsRouter);
  app.use('/api/tasks', tasksRouter);

  // Serve frontend static build if available (production)
  const frontendDist = path.resolve(__dirname, '../../frontend/dist');
  if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    // SPA fallback: serve index.html for non-API routes
    app.get('/{*any}', (_req, res, next) => {
      // Don't interfere with API 404 handling - only serve for non-API, non-health
      if (_req.path.startsWith('/api/') || _req.path.startsWith('/health')) {
        return next();
      }
      res.sendFile(path.join(frontendDist, 'index.html'));
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
