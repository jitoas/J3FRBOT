import express from 'express';
import path from 'path';
import fs from 'fs';
import { logger } from './utils/logger.js';
import { botConfig } from './config/botConfig.js';
import { getDatabase } from './database/index.js';

/**
 * Starts a production Express HTTP server that:
 * 1. Exposes GET /health for Render health checks and UptimeRobot monitoring.
 * 2. Exposes /api endpoints for the Dashboard to customize Levels, XP, Thresholds, and Auto-Roles.
 * 3. Serves the built React SPA Dashboard from dist/.
 * 4. Handles SPA fallback routing so direct dashboard links work seamlessly.
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

  // 1. Health check endpoint for Render & UptimeRobot
  app.get('/health', (req, res) => {
    const isBotReady = Boolean(client?.isReady());
    res.status(isBotReady ? 200 : 503).json({
      status: isBotReady ? 'healthy' : 'starting',
      botReady: isBotReady,
      botTag: client?.user?.tag || null,
      guilds: client?.guilds?.cache?.size || 0,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });

  // --------------------------------------------------------------------------
  // REST API: Guilds & Discord Context
  // --------------------------------------------------------------------------
  app.get('/api/guilds', (req, res) => {
    try {
      const guilds = client?.guilds?.cache?.map(g => ({
        id: g.id,
        name: g.name,
        icon: g.iconURL() || null,
        memberCount: g.memberCount
      })) || [];
      res.json({ guilds });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/guild/channels', (req, res) => {
    try {
      const guildId = req.query.guildId || client?.guilds?.cache?.first()?.id;
      const guild = client?.guilds?.cache?.get(guildId) || client?.guilds?.cache?.first();
      if (!guild) return res.json({ channels: [] });
      const channels = guild.channels.cache
        .filter(c => c.isTextBased())
        .map(c => ({ id: c.id, name: c.name }));
      res.json({ channels });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/guild/roles', (req, res) => {
    try {
      const guildId = req.query.guildId || client?.guilds?.cache?.first()?.id;
      const guild = client?.guilds?.cache?.get(guildId) || client?.guilds?.cache?.first();
      if (!guild) return res.json({ roles: [] });
      const roles = guild.roles.cache
        .filter(r => r.name !== '@everyone')
        .sort((a, b) => b.position - a.position)
        .map(r => ({ id: r.id, name: r.name, color: r.hexColor, position: r.position }));
      res.json({ roles });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // --------------------------------------------------------------------------
  // REST API: Levels Settings
  // --------------------------------------------------------------------------
  app.get('/api/levels/config', async (req, res) => {
    try {
      const guildId = req.query.guildId || client?.guilds?.cache?.first()?.id || 'default_guild';
      const db = getDatabase();
      const config = await db.getGuildConfig(guildId);
      res.json({
        guildId,
        levelingEnabled: config.levelingEnabled !== false,
        xpPerMessage: config.xpPerMessage || 10,
        xpCooldownSeconds: config.xpCooldownSeconds !== undefined ? config.xpCooldownSeconds : 60,
        levelupMessageEnabled: config.levelupMessageEnabled !== false,
        levelupChannelId: config.levelupChannelId || '',
        levelupMessage: config.levelupMessage || 'مبروك {user}! وصلت للمستوى {level} 🎉'
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/levels/config', async (req, res) => {
    try {
      const guildId = req.body.guildId || client?.guilds?.cache?.first()?.id || 'default_guild';
      const db = getDatabase();
      const updated = await db.setGuildConfig(guildId, {
        levelingEnabled: req.body.levelingEnabled !== false,
        xpPerMessage: parseInt(req.body.xpPerMessage, 10) || 10,
        xpCooldownSeconds: parseInt(req.body.xpCooldownSeconds, 10) || 60,
        levelupMessageEnabled: req.body.levelupMessageEnabled !== false,
        levelupChannelId: req.body.levelupChannelId || null,
        levelupMessage: req.body.levelupMessage
      });
      res.json({ success: true, config: updated });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // --------------------------------------------------------------------------
  // REST API: Level XP Thresholds Table
  // --------------------------------------------------------------------------
  app.get('/api/levels/thresholds', async (req, res) => {
    try {
      const guildId = req.query.guildId || client?.guilds?.cache?.first()?.id || 'default_guild';
      const db = getDatabase();
      const thresholds = await db.getLevelThresholds(guildId);
      res.json({ thresholds });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/levels/thresholds', async (req, res) => {
    try {
      const guildId = req.body.guildId || client?.guilds?.cache?.first()?.id || 'default_guild';
      const { thresholds } = req.body;
      const db = getDatabase();
      const updated = await db.setLevelThresholdsBatch(guildId, thresholds);
      res.json({ success: true, thresholds: updated });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/levels/thresholds/single', async (req, res) => {
    try {
      const guildId = req.body.guildId || client?.guilds?.cache?.first()?.id || 'default_guild';
      const level = parseInt(req.body.level, 10);
      const requiredXp = parseInt(req.body.requiredXp, 10);
      const db = getDatabase();
      const saved = await db.setLevelThreshold(guildId, level, requiredXp);
      res.json({ success: true, threshold: saved });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/levels/thresholds/:level', async (req, res) => {
    try {
      const guildId = req.query.guildId || client?.guilds?.cache?.first()?.id || 'default_guild';
      const level = parseInt(req.params.level, 10);
      const db = getDatabase();
      const deleted = await db.deleteLevelThreshold(guildId, level);
      res.json({ success: deleted });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // --------------------------------------------------------------------------
  // REST API: Auto Roles by Level
  // --------------------------------------------------------------------------
  app.get('/api/levels/roles', async (req, res) => {
    try {
      const guildId = req.query.guildId || client?.guilds?.cache?.first()?.id || 'default_guild';
      const db = getDatabase();
      const roles = await db.getLevelRoles(guildId);
      res.json({ roles });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/levels/roles', async (req, res) => {
    try {
      const guildId = req.body.guildId || client?.guilds?.cache?.first()?.id || 'default_guild';
      const db = getDatabase();
      const newRole = await db.addLevelRole(guildId, {
        level: parseInt(req.body.level, 10),
        roleId: req.body.roleId,
        roleName: req.body.roleName || '',
        enabled: req.body.enabled !== false,
        removePrevious: req.body.removePrevious === true
      });
      res.json({ success: true, role: newRole });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/levels/roles/:id', async (req, res) => {
    try {
      const guildId = req.body.guildId || client?.guilds?.cache?.first()?.id || 'default_guild';
      const db = getDatabase();
      const updated = await db.updateLevelRole(guildId, req.params.id, req.body);
      res.json({ success: Boolean(updated), role: updated });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/levels/roles/:id', async (req, res) => {
    try {
      const guildId = req.query.guildId || client?.guilds?.cache?.first()?.id || 'default_guild';
      const db = getDatabase();
      const deleted = await db.deleteLevelRole(guildId, req.params.id);
      res.json({ success: deleted });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // --------------------------------------------------------------------------
  // REST API: Leaderboard
  // --------------------------------------------------------------------------
  app.get('/api/levels/leaderboard', async (req, res) => {
    try {
      const guildId = req.query.guildId || client?.guilds?.cache?.first()?.id || 'default_guild';
      const limit = parseInt(req.query.limit, 10) || 100;
      const db = getDatabase();
      const leaderboard = await db.getLeaderboard(guildId, limit);
      res.json({ leaderboard });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
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
