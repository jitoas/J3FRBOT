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
            leveling_enabled BOOLEAN DEFAULT true,
            xp_rate NUMERIC(3,2) DEFAULT 1.0,
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );

          CREATE TABLE IF NOT EXISTS user_levels (
            guild_id VARCHAR(32) NOT NULL,
            user_id VARCHAR(32) NOT NULL,
            xp BIGINT DEFAULT 0,
            level INT DEFAULT 0,
            last_xp_earned BIGINT DEFAULT 0,
            username VARCHAR(100),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            PRIMARY KEY (guild_id, user_id)
          );

          CREATE TABLE IF NOT EXISTS guild_level_thresholds (
            guild_id VARCHAR(32) NOT NULL,
            level INT NOT NULL,
            required_xp BIGINT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            PRIMARY KEY (guild_id, level)
          );

          CREATE TABLE IF NOT EXISTS guild_level_roles (
            id SERIAL PRIMARY KEY,
            guild_id VARCHAR(32) NOT NULL,
            level INT NOT NULL,
            role_id VARCHAR(32) NOT NULL,
            role_name VARCHAR(100),
            enabled BOOLEAN DEFAULT true,
            remove_previous BOOLEAN DEFAULT false,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );

          ALTER TABLE guild_configs ADD COLUMN IF NOT EXISTS commands_channel_id VARCHAR(32);
          ALTER TABLE guild_configs ADD COLUMN IF NOT EXISTS welcome_background_path TEXT;
          ALTER TABLE guild_configs ADD COLUMN IF NOT EXISTS welcome_card_config JSONB;
          ALTER TABLE guild_configs ADD COLUMN IF NOT EXISTS xp_per_message INT DEFAULT 10;
          ALTER TABLE guild_configs ADD COLUMN IF NOT EXISTS xp_cooldown_seconds INT DEFAULT 60;
          ALTER TABLE guild_configs ADD COLUMN IF NOT EXISTS levelup_message_enabled BOOLEAN DEFAULT true;
          ALTER TABLE guild_configs ADD COLUMN IF NOT EXISTS levelup_channel_id VARCHAR(32);
          ALTER TABLE guild_configs ADD COLUMN IF NOT EXISTS levelup_message TEXT DEFAULT 'مبروك {user}! وصلت للمستوى {level} 🎉';
          ALTER TABLE user_levels ADD COLUMN IF NOT EXISTS username VARCHAR(100);
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
        welcomeChannelId: botConfig.defaults.welcomeChannelId || null,
        welcomeEnabled: botConfig.defaults.welcomeEnabled,
        welcomeMessage: botConfig.defaults.welcomeMessage,
        welcomeCustomText: botConfig.defaults.welcomeCustomText,
        welcomeBackgroundPath: botConfig.defaults.welcomeBackgroundPath,
        welcomeCardConfig: { ...botConfig.defaults.welcomeCardConfig },
        logsChannelId: botConfig.defaults.logsChannelId || null,
        logsEnabled: botConfig.defaults.logsEnabled,
        commandsChannelId: botConfig.defaults.commandsChannelId || null,
        levelingEnabled: botConfig.defaults.levelingEnabled,
        xpPerMessage: botConfig.defaults.xpPerMessage,
        xpCooldownSeconds: botConfig.defaults.xpCooldownSeconds,
        levelupMessageEnabled: botConfig.defaults.levelupMessageEnabled,
        levelupChannelId: botConfig.defaults.levelupChannelId,
        levelupMessage: botConfig.defaults.levelupMessage,
        xpRate: botConfig.defaults.xpRate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    const row = res.rows[0];
    return {
      guildId: row.guild_id,
      welcomeChannelId: row.welcome_channel_id || botConfig.defaults.welcomeChannelId || null,
      welcomeEnabled: row.welcome_enabled !== false,
      welcomeMessage: row.welcome_message || botConfig.defaults.welcomeMessage,
      welcomeCustomText: botConfig.defaults.welcomeCustomText,
      welcomeBackgroundPath: row.welcome_background_path || botConfig.defaults.welcomeBackgroundPath,
      welcomeCardConfig: (typeof row.welcome_card_config === 'string'
        ? (() => { try { return JSON.parse(row.welcome_card_config); } catch { return null; } })()
        : row.welcome_card_config) || { ...botConfig.defaults.welcomeCardConfig },
      logsChannelId: row.logs_channel_id || botConfig.defaults.logsChannelId || null,
      logsEnabled: row.logs_enabled !== false,
      commandsChannelId: row.commands_channel_id || botConfig.defaults.commandsChannelId || null,
      levelingEnabled: row.leveling_enabled !== false,
      xpPerMessage: parseInt(row.xp_per_message, 10) || botConfig.defaults.xpPerMessage,
      xpCooldownSeconds: parseInt(row.xp_cooldown_seconds, 10) || botConfig.defaults.xpCooldownSeconds,
      levelupMessageEnabled: row.levelup_message_enabled !== false,
      levelupChannelId: row.levelup_channel_id || null,
      levelupMessage: row.levelup_message || botConfig.defaults.levelupMessage,
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
        xp_per_message,
        xp_cooldown_seconds,
        levelup_message_enabled,
        levelup_channel_id,
        levelup_message,
        xp_rate,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
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
        xp_per_message = EXCLUDED.xp_per_message,
        xp_cooldown_seconds = EXCLUDED.xp_cooldown_seconds,
        levelup_message_enabled = EXCLUDED.levelup_message_enabled,
        levelup_channel_id = EXCLUDED.levelup_channel_id,
        levelup_message = EXCLUDED.levelup_message,
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
      typeof updated.welcomeCardConfig === 'string'
        ? updated.welcomeCardConfig
        : JSON.stringify(updated.welcomeCardConfig || botConfig.defaults.welcomeCardConfig),
      updated.logsChannelId,
      updated.logsEnabled,
      updated.commandsChannelId,
      updated.levelingEnabled,
      updated.xpPerMessage,
      updated.xpCooldownSeconds,
      updated.levelupMessageEnabled,
      updated.levelupChannelId,
      updated.levelupMessage,
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
        username: null,
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
      username: row.username || null,
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
        username,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (guild_id, user_id) DO UPDATE SET
        xp = EXCLUDED.xp,
        level = EXCLUDED.level,
        last_xp_earned = EXCLUDED.last_xp_earned,
        username = COALESCE(EXCLUDED.username, user_levels.username),
        updated_at = NOW()
      RETURNING *;
    `;

    const values = [
      guildId,
      userId,
      updated.xp,
      updated.level,
      updated.lastXpEarned,
      updated.username || null
    ];

    await this.pool.query(query, values);
    return updated;
  }

  async getLeaderboard(guildId, limit = 100) {
    if (!this.pool) {
      throw new Error('[PostgreSQL Adapter] Cannot execute query: Pool is not connected.');
    }

    const query = `
      SELECT guild_id, user_id, username, xp, level, last_xp_earned, updated_at
      FROM user_levels
      WHERE guild_id = $1
      ORDER BY xp DESC
      LIMIT $2
    `;
    const res = await this.pool.query(query, [guildId, limit]);
    return res.rows.map(row => ({
      guildId: row.guild_id,
      userId: row.user_id,
      username: row.username || `User_${row.user_id.slice(-4)}`,
      xp: parseInt(row.xp, 10) || 0,
      level: parseInt(row.level, 10) || 0,
      lastXpEarned: parseInt(row.last_xp_earned, 10) || 0,
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString()
    }));
  }

  // --- Custom Level XP Thresholds Table Methods ---

  async getLevelThresholds(guildId) {
    if (!this.pool) {
      throw new Error('[PostgreSQL Adapter] Cannot execute query: Pool is not connected.');
    }

    const query = `
      SELECT level, required_xp
      FROM guild_level_thresholds
      WHERE guild_id = $1
      ORDER BY level ASC
    `;
    const res = await this.pool.query(query, [guildId]);

    if (res.rows.length === 0) {
      // Return defaults if none configured yet
      return botConfig.defaults.defaultLevelThresholds.map(t => ({
        level: t.level,
        requiredXp: t.requiredXp
      }));
    }

    return res.rows.map(row => ({
      level: parseInt(row.level, 10),
      requiredXp: parseInt(row.required_xp, 10)
    }));
  }

  async setLevelThreshold(guildId, level, requiredXp) {
    if (!this.pool) {
      throw new Error('[PostgreSQL Adapter] Cannot execute query: Pool is not connected.');
    }

    const query = `
      INSERT INTO guild_level_thresholds (guild_id, level, required_xp, updated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (guild_id, level) DO UPDATE SET
        required_xp = EXCLUDED.required_xp,
        updated_at = NOW()
      RETURNING *;
    `;
    const res = await this.pool.query(query, [guildId, level, requiredXp]);
    return {
      level: parseInt(res.rows[0].level, 10),
      requiredXp: parseInt(res.rows[0].required_xp, 10)
    };
  }

  async deleteLevelThreshold(guildId, level) {
    if (!this.pool) {
      throw new Error('[PostgreSQL Adapter] Cannot execute query: Pool is not connected.');
    }

    const query = 'DELETE FROM guild_level_thresholds WHERE guild_id = $1 AND level = $2';
    const res = await this.pool.query(query, [guildId, level]);
    return (res.rowCount || 0) > 0;
  }

  async setLevelThresholdsBatch(guildId, thresholds) {
    if (!this.pool) {
      throw new Error('[PostgreSQL Adapter] Cannot execute query: Pool is not connected.');
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM guild_level_thresholds WHERE guild_id = $1', [guildId]);

      for (const t of thresholds) {
        await client.query(
          'INSERT INTO guild_level_thresholds (guild_id, level, required_xp, updated_at) VALUES ($1, $2, $3, NOW())',
          [guildId, t.level, t.requiredXp]
        );
      }

      await client.query('COMMIT');
      return await this.getLevelThresholds(guildId);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  // --- Auto Roles by Level Methods ---

  async getLevelRoles(guildId) {
    if (!this.pool) {
      throw new Error('[PostgreSQL Adapter] Cannot execute query: Pool is not connected.');
    }

    const query = `
      SELECT id, guild_id, level, role_id, role_name, enabled, remove_previous, created_at, updated_at
      FROM guild_level_roles
      WHERE guild_id = $1
      ORDER BY level ASC, id ASC
    `;
    const res = await this.pool.query(query, [guildId]);
    return res.rows.map(row => ({
      id: row.id,
      guildId: row.guild_id,
      level: parseInt(row.level, 10),
      roleId: row.role_id,
      roleName: row.role_name || '',
      enabled: row.enabled !== false,
      removePrevious: row.remove_previous === true,
      updatedAt: row.updated_at
    }));
  }

  async addLevelRole(guildId, roleData) {
    if (!this.pool) {
      throw new Error('[PostgreSQL Adapter] Cannot execute query: Pool is not connected.');
    }

    const query = `
      INSERT INTO guild_level_roles (
        guild_id,
        level,
        role_id,
        role_name,
        enabled,
        remove_previous
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [
      guildId,
      roleData.level,
      roleData.roleId,
      roleData.roleName || '',
      roleData.enabled !== false,
      roleData.removePrevious === true
    ];
    const res = await this.pool.query(query, values);
    const row = res.rows[0];
    return {
      id: row.id,
      guildId: row.guild_id,
      level: parseInt(row.level, 10),
      roleId: row.role_id,
      roleName: row.role_name,
      enabled: row.enabled,
      removePrevious: row.remove_previous
    };
  }

  async updateLevelRole(guildId, id, roleData) {
    if (!this.pool) {
      throw new Error('[PostgreSQL Adapter] Cannot execute query: Pool is not connected.');
    }

    const query = `
      UPDATE guild_level_roles SET
        level = COALESCE($3, level),
        role_id = COALESCE($4, role_id),
        role_name = COALESCE($5, role_name),
        enabled = COALESCE($6, enabled),
        remove_previous = COALESCE($7, remove_previous),
        updated_at = NOW()
      WHERE guild_id = $1 AND id = $2
      RETURNING *;
    `;
    const values = [
      guildId,
      id,
      roleData.level !== undefined ? roleData.level : null,
      roleData.roleId !== undefined ? roleData.roleId : null,
      roleData.roleName !== undefined ? roleData.roleName : null,
      roleData.enabled !== undefined ? roleData.enabled : null,
      roleData.removePrevious !== undefined ? roleData.removePrevious : null
    ];
    const res = await this.pool.query(query, values);
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      id: row.id,
      guildId: row.guild_id,
      level: parseInt(row.level, 10),
      roleId: row.role_id,
      roleName: row.role_name,
      enabled: row.enabled,
      removePrevious: row.remove_previous
    };
  }

  async deleteLevelRole(guildId, id) {
    if (!this.pool) {
      throw new Error('[PostgreSQL Adapter] Cannot execute query: Pool is not connected.');
    }

    const query = 'DELETE FROM guild_level_roles WHERE guild_id = $1 AND id = $2';
    const res = await this.pool.query(query, [guildId, id]);
    return (res.rowCount || 0) > 0;
  }
}
