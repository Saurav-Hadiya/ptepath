import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env';
import { connectDB, disconnectDB } from './config/db';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';
import { swaggerSpec } from './config/swagger';

const app = express();

// CORS — origins must be an array; credentials enabled for httpOnly refresh cookie.
const allowedOrigins = Array.from(new Set([env.frontendUrl, 'http://localhost:3000']));
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Swagger UI — API documentation.
app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'PTEPath API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 2,
      docExpansion: 'list',
    },
  })
);

// Raw OpenAPI spec (JSON) — useful for code generation tools.
app.get('/api/docs.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Health check — no auth required.
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'Success', timestamp: new Date().toISOString() });
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

  // Stray async errors should be logged loudly but must NOT take the server
  // down — almost all request errors are already caught by asyncHandler and the
  // Express error handler. Keeping the process alive avoids dropping every other
  // in-flight request because of one unhandled rejection.
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled promise rejection (server kept alive):', reason);
  });
  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception (server kept alive):', error);
  });
}

start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

export default app;
