import fs from 'fs/promises';
import path from 'path';
import { BaseAdapter } from './baseAdapter.js';
import { logger } from '../../utils/logger.js';
import { botConfig } from '../../config/botConfig.js';

export class JsonDatabaseAdapter extends BaseAdapter {
  constructor(filePath = './data/database.json') {
    super();
    this.filePath = path.resolve(filePath);
    this.data = {
      guilds: {},
      levels: {}
    };
    this.isWriting = false;
    this.pendingWrite = false;
  }

  async connect() {
    try {
      const dir = path.dirname(this.filePath);
      await fs.mkdir(dir, { recursive: true });

      try {
        const content = await fs.readFile(this.filePath, 'utf-8');
        this.data = JSON.parse(content);
        logger.info(`Database loaded successfully from ${this.filePath}`);
      } catch (err) {
        if (err.code === 'ENOENT') {
          logger.info(`Database file not found. Creating new empty database at ${this.filePath}`);
          await this.save();
        } else {
          logger.error(`Error reading database file: ${err.message}`);
          throw err;
        }
      }
    } catch (error) {
      logger.error(`Failed to initialize JSON database: ${error.message}`);
      throw error;
    }
  }

  async disconnect() {
    await this.save();
    logger.info('JSON Database flushed and closed.');
  }

  async save() {
    if (this.isWriting) {
      this.pendingWrite = true;
      return;
    }

    this.isWriting = true;
    try {
      const tempPath = `${this.filePath}.tmp`;
      const jsonString = JSON.stringify(this.data, null, 2);
      await fs.writeFile(tempPath, jsonString, 'utf-8');
      await fs.rename(tempPath, this.filePath);
    } catch (error) {
      logger.error(`Failed to write JSON database: ${error.message}`);
    } finally {
      this.isWriting = false;
      if (this.pendingWrite) {
        this.pendingWrite = false;
        await this.save();
      }
    }
  }

  async getGuildConfig(guildId) {
    if (!this.data.guilds) this.data.guilds = {};
    if (!this.data.guilds[guildId]) {
      // Return default config merged with guildId
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
        xpRate: botConfig.defaults.xpRate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    return { ...this.data.guilds[guildId] };
  }

  async setGuildConfig(guildId, configData) {
    if (!this.data.guilds) this.data.guilds = {};
    const existing = await this.getGuildConfig(guildId);
    
    this.data.guilds[guildId] = {
      ...existing,
      ...configData,
      guildId,
      updatedAt: new Date().toISOString()
    };

    await this.save();
    return this.data.guilds[guildId];
  }

  async deleteGuildConfig(guildId) {
    if (this.data.guilds && this.data.guilds[guildId]) {
      delete this.data.guilds[guildId];
      await this.save();
      return true;
    }
    return false;
  }

  async getUserLevel(guildId, userId) {
    const key = `${guildId}_${userId}`;
    if (!this.data.levels) this.data.levels = {};
    
    if (!this.data.levels[key]) {
      return {
        guildId,
        userId,
        xp: 0,
        level: 0,
        lastXpEarned: 0,
        updatedAt: new Date().toISOString()
      };
    }
    return { ...this.data.levels[key] };
  }

  async setUserLevel(guildId, userId, levelData) {
    const key = `${guildId}_${userId}`;
    if (!this.data.levels) this.data.levels = {};
    const existing = await this.getUserLevel(guildId, userId);

    this.data.levels[key] = {
      ...existing,
      ...levelData,
      guildId,
      userId,
      updatedAt: new Date().toISOString()
    };

    await this.save();
    return this.data.levels[key];
  }

  async getLeaderboard(guildId, limit = 10) {
    if (!this.data.levels) return [];
    
    const guildLevels = Object.values(this.data.levels)
      .filter(item => item.guildId === guildId)
      .sort((a, b) => b.xp - a.xp)
      .slice(0, limit);

    return guildLevels;
  }
}
