import express from 'express';
import path from 'path';
import fs from 'fs';
import { logger } from './utils/logger.js';
import { botConfig } from './config/botConfig.js';

/**
 * Starts a production Express HTTP server that:
 * 1. Exposes GET /health for Render health checks and UptimeRobot monitoring.
 * 2. Serves the built React SPA Dashboard from dist/.
 * 3. Handles SPA fallback routing so direct dashboard links work seamlessly.
 */
export const startWebServer = (client) => {
  const app = express();
  const port = botConfig.port || 3000;

  app.use(express.json());

  // Determine dist folder path (handles running from project root or bot subdirectory)
  let distPath = path.resolve(process.cwd(), 'dist');
  if (!fs.existsSync(distPath)) {
    const altDist = path.resolve(process.cwd(), '../dist');
    if (fs.existsSync(altDist)) {
      distPath = altDist;
    }
  }

  // 1. Health check endpoint for Render & UptimeRobot (must be registered before SPA fallback)
  app.get('/health', (req, res) => {
    const isBotReady = Boolean(client?.isReady());
    
    // Status is healthy if bot is connected, or starting if still in login phase
    res.status(isBotReady ? 200 : 503).json({
      status: isBotReady ? 'healthy' : 'starting',
      botReady: isBotReady,
      botTag: client?.user?.tag || null,
      guilds: client?.guilds?.cache?.size || 0,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });

  // 2. Serve built static assets from Vite dist/
  app.use(express.static(distPath));

  // 3. React SPA Fallback: Serve dist/index.html for all frontend routes
  app.get('*', (req, res) => {
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
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
              <p style="margin-top: 1.5rem; font-size: 0.8rem; color: #64748b;">React dashboard not yet built to dist/. Run 'npm run build' to generate the dashboard bundle.</p>
            </div>
          </body>
        </html>
      `);
    }
  });

  const server = app.listen(port, '0.0.0.0', () => {
    logger.info(`HTTP Server serving React Dashboard and /health on http://0.0.0.0:${port}`);
  });

  return server;
};
