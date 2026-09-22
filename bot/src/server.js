import express from 'express';
import { logger } from './utils/logger.js';
import { botConfig } from './config/botConfig.js';

/**
 * Starts a lightweight Express HTTP server to satisfy Render Web Service health-checks
 * and enable UptimeRobot / Cron monitoring to keep the bot alive.
 */
export const startWebServer = (client) => {
  const app = express();
  const port = botConfig.port || 3000;

  app.use(express.json());

  // Health check endpoint for Render
  app.get('/health', (req, res) => {
    const isReady = client?.isReady();
    res.status(isReady ? 200 : 503).json({
      status: isReady ? 'healthy' : 'starting',
      botTag: client?.user?.tag || null,
      guilds: client?.guilds?.cache?.size || 0,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });

  // Root endpoint
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <title>Discord Bot Master - Status</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #1e293b; padding: 2.5rem; border-radius: 1rem; border: 1px solid #334155; text-align: center; max-width: 480px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
            .badge { display: inline-block; background: #059669; color: #ecfdf5; padding: 0.35rem 1rem; border-radius: 9999px; font-weight: 600; font-size: 0.875rem; margin-bottom: 1rem; }
            h1 { margin: 0 0 0.5rem 0; font-size: 1.5rem; }
            p { color: #94a3b8; font-size: 0.95rem; line-height: 1.5; margin: 0.5rem 0; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge">🟢 Bot Online & Healthy</div>
            <h1>Discord Bot Master</h1>
            <p>Bot Tag: <strong>${client?.user?.tag || 'Initializing...'}</strong></p>
            <p>Connected Servers: <strong>${client?.guilds?.cache?.size || 0}</strong></p>
            <p style="margin-top: 1.5rem; font-size: 0.8rem; color: #64748b;">Render Keep-Alive & Health Check Service active on port ${port}</p>
          </div>
        </body>
      </html>
    `);
  });

  const server = app.listen(port, '0.0.0.0', () => {
    logger.info(`HTTP Health Check Server listening on http://0.0.0.0:${port}`);
  });

  return server;
};
