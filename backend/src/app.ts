import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { env } from './config/env';
import { connectDB, disconnectDB } from './config/db';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';

const app = express();

app.use(cors({ origin: env.frontendUrl, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api', routes);

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
