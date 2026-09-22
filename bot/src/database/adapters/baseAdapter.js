/**
 * Base Database Adapter Interface
 * All database implementations (JSON, SQLite, PostgreSQL, Supabase, MongoDB)
 * must implement these standard methods.
 */
export class BaseAdapter {
  constructor() {
    if (this.constructor === BaseAdapter) {
      throw new Error('BaseAdapter is abstract and cannot be instantiated directly.');
    }
  }

  async connect() {
    throw new Error('Method connect() must be implemented.');
  }

  async disconnect() {
    throw new Error('Method disconnect() must be implemented.');
  }

  async getGuildConfig(guildId) {
    throw new Error('Method getGuildConfig() must be implemented.');
  }

  async setGuildConfig(guildId, configData) {
    throw new Error('Method setGuildConfig() must be implemented.');
  }

  async deleteGuildConfig(guildId) {
    throw new Error('Method deleteGuildConfig() must be implemented.');
  }

  async getUserLevel(guildId, userId) {
    throw new Error('Method getUserLevel() must be implemented.');
  }

  async setUserLevel(guildId, userId, levelData) {
    throw new Error('Method setUserLevel() must be implemented.');
  }

  async getLeaderboard(guildId, limit = 10) {
    throw new Error('Method getLeaderboard() must be implemented.');
  }

  async getLevelThresholds(guildId) {
    throw new Error('Method getLevelThresholds() must be implemented.');
  }

  async setLevelThreshold(guildId, level, requiredXp) {
    throw new Error('Method setLevelThreshold() must be implemented.');
  }

  async deleteLevelThreshold(guildId, level) {
    throw new Error('Method deleteLevelThreshold() must be implemented.');
  }

  async setLevelThresholdsBatch(guildId, thresholds) {
    throw new Error('Method setLevelThresholdsBatch() must be implemented.');
  }

  async getLevelRoles(guildId) {
    throw new Error('Method getLevelRoles() must be implemented.');
  }

  async addLevelRole(guildId, roleData) {
    throw new Error('Method addLevelRole() must be implemented.');
  }

  async updateLevelRole(guildId, id, roleData) {
    throw new Error('Method updateLevelRole() must be implemented.');
  }

  async deleteLevelRole(guildId, id) {
    throw new Error('Method deleteLevelRole() must be implemented.');
  }
}
