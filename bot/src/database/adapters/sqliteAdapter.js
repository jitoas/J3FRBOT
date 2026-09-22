import { BaseAdapter } from './baseAdapter.js';
import { logger } from '../../utils/logger.js';
import { botConfig } from '../../config/botConfig.js';

/**
 * SQLite Database Adapter
 * Ready for integration with sqlite3 or better-sqlite3
 */
export class SqliteDatabaseAdapter extends BaseAdapter {
  constructor(dbPath = './data/bot.sqlite') {
    super();
    this.dbPath = dbPath;
    this.db = null;
  }

  async connect() {
    logger.info(`[SQLite Adapter] Configured for ${this.dbPath}. Schema ready for execution.`);
    // Table initialization DDL:
    // CREATE TABLE IF NOT EXISTS guild_configs (
    //   guild_id TEXT PRIMARY KEY,
    //   welcome_channel_id TEXT,
    //   welcome_enabled INTEGER DEFAULT 1,
    //   welcome_message TEXT,
    //   welcome_theme TEXT DEFAULT 'modern-dark',
    //   logs_channel_id TEXT,
    //   logs_enabled INTEGER DEFAULT 1,
    //   leveling_enabled INTEGER DEFAULT 0,
    //   xp_rate REAL DEFAULT 1.0,
    //   updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    // );
    // CREATE TABLE IF NOT EXISTS user_levels (
    //   guild_id TEXT,
    //   user_id TEXT,
    //   xp INTEGER DEFAULT 0,
    //   level INTEGER DEFAULT 0,
    //   last_xp_earned INTEGER DEFAULT 0,
    //   updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    //   PRIMARY KEY (guild_id, user_id)
    // );
  }

  async disconnect() {
    logger.info('[SQLite Adapter] Disconnected.');
  }

  async getGuildConfig(guildId) {
    // Falls back gracefully
    return {
      guildId,
      welcomeChannelId: null,
      welcomeEnabled: botConfig.defaults.welcomeEnabled,
      welcomeMessage: botConfig.defaults.welcomeMessage,
      welcomeTheme: botConfig.defaults.welcomeTheme,
      logsChannelId: null,
      logsEnabled: botConfig.defaults.logsEnabled,
      levelingEnabled: botConfig.defaults.levelingEnabled,
      xpRate: botConfig.defaults.xpRate
    };
  }

  async setGuildConfig(guildId, configData) {
    return { guildId, ...configData };
  }

  async deleteGuildConfig(guildId) {
    return true;
  }

  async getUserLevel(guildId, userId) {
    return { guildId, userId, xp: 0, level: 0 };
  }

  async setUserLevel(guildId, userId, levelData) {
    return { guildId, userId, ...levelData };
  }

  async getLeaderboard(guildId, limit = 10) {
    return [];
  }
}
