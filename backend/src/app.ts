import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { env } from './config/env';
import { connectDB, disconnectDB } from './config/db';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';

const app = express();

// CORS — origins must be an array; credentials enabled for httpOnly refresh cookie.
app.use(
  cors({
    origin: [env.frontendUrl],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Health check — no auth required.
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', routes);

// 404 handler for unknown routes — before the error handler.
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

async function start(): Promise<void> {
  await connectDB();

  const server = app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });

  let shuttingDown = false;

  async function shutdown(reason: string): Promise<void> {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`\n${reason} received. Shutting down gracefully...`);

    // Force-exit if cleanup hangs.
    const forceTimer = setTimeout(() => {
      console.error('Could not close connections in time. Forcing shutdown.');
      process.exit(1);
    }, 10000);
    forceTimer.unref();

    server.close(async () => {
      console.log('HTTP server closed');
      await disconnectDB();
      clearTimeout(forceTimer);
      process.exit(0);
    });
  }

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled promise rejection:', reason);
    void shutdown('unhandledRejection');
  });
  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    void shutdown('uncaughtException');
  });
}

start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

export default app;
