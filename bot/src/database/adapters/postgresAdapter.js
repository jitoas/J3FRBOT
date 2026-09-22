import pg from 'pg';
import { BaseAdapter } from './baseAdapter.js';
import { logger } from '../../utils/logger.js';
import { botConfig } from '../../config/botConfig.js';

const { Pool } = pg;

/**
 * PostgreSQL & Supabase Database Adapter
 * Production-ready PostgreSQL connection pool with automated migrations
 * and parameterized query operations.
 */
export class PostgresDatabaseAdapter extends BaseAdapter {
  constructor(connectionString = process.env.DATABASE_URL) {
    super();
    this.connectionString = connectionString;
    this.pool = null;
  }

  async connect() {
    if (!this.connectionString) {
      throw new Error(
        'DATABASE_URL environment variable is required to connect to PostgreSQL/Supabase.'
      );
    }

    try {
      const isSslNeeded =
        process.env.NODE_ENV === 'production' ||
        this.connectionString.includes('supabase') ||
        this.connectionString.includes('sslmode=require');

      this.pool = new Pool({
        connectionString: this.connectionString,
        ssl: isSslNeeded ? { rejectUnauthorized: false } : undefined
      });

      // Test connection & run migrations
      const client = await this.pool.connect();
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS guild_configs (
            guild_id VARCHAR(32) PRIMARY KEY,
            welcome_channel_id VARCHAR(32),
            welcome_enabled BOOLEAN DEFAULT true,
            welcome_message TEXT,
            welcome_theme VARCHAR(64) DEFAULT 'modern-dark',
            logs_channel_id VARCHAR(32),
            logs_enabled BOOLEAN DEFAULT true,
            leveling_enabled BOOLEAN DEFAULT false,
            xp_rate NUMERIC(3,2) DEFAULT 1.0,
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );

          CREATE TABLE IF NOT EXISTS user_levels (
            guild_id VARCHAR(32) NOT NULL,
            user_id VARCHAR(32) NOT NULL,
            xp BIGINT DEFAULT 0,
            level INT DEFAULT 0,
            last_xp_earned BIGINT DEFAULT 0,
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            PRIMARY KEY (guild_id, user_id)
          );

          ALTER TABLE guild_configs ADD COLUMN IF NOT EXISTS commands_channel_id VARCHAR(32);
          ALTER TABLE guild_configs ADD COLUMN IF NOT EXISTS welcome_background_path TEXT;
          ALTER TABLE guild_configs ADD COLUMN IF NOT EXISTS welcome_card_config JSONB;
        `);
        logger.info('[PostgreSQL Adapter] Connected and automatic migrations verified successfully.');
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error(`[PostgreSQL Adapter] Connection failed: ${error.message}`);
      throw error;
    }
  }

  async disconnect() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      logger.info('[PostgreSQL Adapter] Disconnected and connection pool closed.');
    }
  }

  async getGuildConfig(guildId) {
    if (!this.pool) {
      throw new Error('[PostgreSQL Adapter] Cannot execute query: Pool is not connected.');
    }

    const query = 'SELECT * FROM guild_configs WHERE guild_id = $1';
    const res = await this.pool.query(query, [guildId]);

    if (res.rows.length === 0) {
      return {
        guildId,
        welcomeChannelId: null,
        welcomeEnabled: botConfig.defaults.welcomeEnabled,
        welcomeMessage: botConfig.defaults.welcomeMessage,
        welcomeCustomText: botConfig.defaults.welcomeCustomText,
        welcomeBackgroundPath: botConfig.defaults.welcomeBackgroundPath,
        welcomeCardConfig: { ...botConfig.defaults.welcomeCardConfig },
        logsChannelId: null,
        logsEnabled: botConfig.defaults.logsEnabled,
        commandsChannelId: null,
        levelingEnabled: botConfig.defaults.levelingEnabled,
        xpRate: botConfig.defaults.xpRate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    const row = res.rows[0];
    return {
      guildId: row.guild_id,
      welcomeChannelId: row.welcome_channel_id || null,
      welcomeEnabled: row.welcome_enabled !== false,
      welcomeMessage: row.welcome_message || botConfig.defaults.welcomeMessage,
      welcomeCustomText: botConfig.defaults.welcomeCustomText,
      welcomeBackgroundPath: row.welcome_background_path || botConfig.defaults.welcomeBackgroundPath,
      welcomeCardConfig: row.welcome_card_config || { ...botConfig.defaults.welcomeCardConfig },
      logsChannelId: row.logs_channel_id || null,
      logsEnabled: row.logs_enabled !== false,
      commandsChannelId: row.commands_channel_id || null,
      levelingEnabled: row.leveling_enabled === true,
      xpRate: parseFloat(row.xp_rate) || botConfig.defaults.xpRate,
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString()
    };
  }

  async setGuildConfig(guildId, configData) {
    if (!this.pool) {
      throw new Error('[PostgreSQL Adapter] Cannot execute query: Pool is not connected.');
    }

    const current = await this.getGuildConfig(guildId);
    const updated = { ...current, ...configData, guildId };

    const query = `
      INSERT INTO guild_configs (
        guild_id,
        welcome_channel_id,
        welcome_enabled,
        welcome_message,
        welcome_background_path,
        welcome_card_config,
        logs_channel_id,
        logs_enabled,
        commands_channel_id,
        leveling_enabled,
        xp_rate,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      ON CONFLICT (guild_id) DO UPDATE SET
        welcome_channel_id = EXCLUDED.welcome_channel_id,
        welcome_enabled = EXCLUDED.welcome_enabled,
        welcome_message = EXCLUDED.welcome_message,
        welcome_background_path = EXCLUDED.welcome_background_path,
        welcome_card_config = EXCLUDED.welcome_card_config,
        logs_channel_id = EXCLUDED.logs_channel_id,
        logs_enabled = EXCLUDED.logs_enabled,
        commands_channel_id = EXCLUDED.commands_channel_id,
        leveling_enabled = EXCLUDED.leveling_enabled,
        xp_rate = EXCLUDED.xp_rate,
        updated_at = NOW()
      RETURNING *;
    `;

    const values = [
      guildId,
      updated.welcomeChannelId,
      updated.welcomeEnabled,
      updated.welcomeMessage,
      updated.welcomeBackgroundPath,
      JSON.stringify(updated.welcomeCardConfig),
      updated.logsChannelId,
      updated.logsEnabled,
      updated.commandsChannelId,
      updated.levelingEnabled,
      updated.xpRate
    ];

    await this.pool.query(query, values);
    return updated;
  }

  async deleteGuildConfig(guildId) {
    if (!this.pool) {
      throw new Error('[PostgreSQL Adapter] Cannot execute query: Pool is not connected.');
    }

    const query = 'DELETE FROM guild_configs WHERE guild_id = $1';
    const res = await this.pool.query(query, [guildId]);
    return (res.rowCount || 0) > 0;
  }

  async getUserLevel(guildId, userId) {
    if (!this.pool) {
      throw new Error('[PostgreSQL Adapter] Cannot execute query: Pool is not connected.');
    }

    const query = 'SELECT * FROM user_levels WHERE guild_id = $1 AND user_id = $2';
    const res = await this.pool.query(query, [guildId, userId]);

    if (res.rows.length === 0) {
      return {
        guildId,
        userId,
        xp: 0,
        level: 0,
        lastXpEarned: 0,
        updatedAt: new Date().toISOString()
      };
    }

    const row = res.rows[0];
    return {
      guildId: row.guild_id,
      userId: row.user_id,
      xp: parseInt(row.xp, 10) || 0,
      level: parseInt(row.level, 10) || 0,
      lastXpEarned: parseInt(row.last_xp_earned, 10) || 0,
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString()
    };
  }

  async setUserLevel(guildId, userId, levelData) {
    if (!this.pool) {
      throw new Error('[PostgreSQL Adapter] Cannot execute query: Pool is not connected.');
    }

    const current = await this.getUserLevel(guildId, userId);
    const updated = { ...current, ...levelData, guildId, userId };

    const query = `
      INSERT INTO user_levels (
        guild_id,
        user_id,
        xp,
        level,
        last_xp_earned,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (guild_id, user_id) DO UPDATE SET
        xp = EXCLUDED.xp,
        level = EXCLUDED.level,
        last_xp_earned = EXCLUDED.last_xp_earned,
        updated_at = NOW()
      RETURNING *;
    `;

    const values = [
      guildId,
      userId,
      updated.xp,
      updated.level,
      updated.lastXpEarned
    ];

    await this.pool.query(query, values);
    return updated;
  }

  async getLeaderboard(guildId, limit = 10) {
    if (!this.pool) {
      throw new Error('[PostgreSQL Adapter] Cannot execute query: Pool is not connected.');
    }

    const query = `
      SELECT guild_id, user_id, xp, level, last_xp_earned, updated_at
      FROM user_levels
      WHERE guild_id = $1
      ORDER BY xp DESC
      LIMIT $2
    `;
    const res = await this.pool.query(query, [guildId, limit]);
    return res.rows.map(row => ({
      guildId: row.guild_id,
      userId: row.user_id,
      xp: parseInt(row.xp, 10) || 0,
      level: parseInt(row.level, 10) || 0,
      lastXpEarned: parseInt(row.last_xp_earned, 10) || 0,
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString()
    }));
  }
}
