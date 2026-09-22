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
}
