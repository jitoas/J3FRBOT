import { getDatabase } from '../database/index.js';
import { logger } from '../utils/logger.js';

export class LevelService {
  static COOLDOWN_SECONDS = 60;
  static BASE_XP_PER_MESSAGE = 15;
  static RANDOM_XP_RANGE = 10; // 15 to 25 XP

  /**
   * Calculates the XP needed to reach the next level.
   * Formula: 5 * (level ^ 2) + 50 * level + 100
   */
  static getRequiredXpForLevel(level) {
    return 5 * Math.pow(level, 2) + 50 * level + 100;
  }

  /**
   * Hook called on messageCreate event if leveling is enabled.
   */
  static async handleMessage(message) {
    if (!message.guild || message.author.bot) return;

    try {
      const db = getDatabase();
      const config = await db.getGuildConfig(message.guild.id);

      if (!config.levelingEnabled) {
        return; // Leveling disabled on this server
      }

      const userId = message.author.id;
      const guildId = message.guild.id;
      const now = Date.now();

      const userStats = await db.getUserLevel(guildId, userId);

      // Cooldown check (prevent spamming XP)
      if (now - userStats.lastXpEarned < this.COOLDOWN_SECONDS * 1000) {
        return;
      }

      // Random XP calculation multiplied by custom server xpRate
      const earnedXp = Math.floor(
        (this.BASE_XP_PER_MESSAGE + Math.random() * this.RANDOM_XP_RANGE) * (config.xpRate || 1.0)
      );

      const newTotalXp = (userStats.xp || 0) + earnedXp;
      let currentLevel = userStats.level || 0;
      let xpForNext = this.getRequiredXpForLevel(currentLevel);
      let leveledUp = false;

      // Check if leveled up
      while (newTotalXp >= xpForNext) {
        currentLevel++;
        leveledUp = true;
        xpForNext = this.getRequiredXpForLevel(currentLevel);
      }

      await db.setUserLevel(guildId, userId, {
        xp: newTotalXp,
        level: currentLevel,
        lastXpEarned: now
      });

      if (leveledUp) {
        logger.info(`User ${message.author.tag} leveled up to Level ${currentLevel} in ${message.guild.name}`);
        
        // Notify level up if configured
        if (config.levelNotification !== false) {
          await message.channel.send({
            content: `🎉 تهانينا ${message.author}! لقد ارتقيت إلى **المستوى ${currentLevel}**! 🚀`
          }).catch(() => {});
        }
      }
    } catch (error) {
      logger.error(`Error in LevelService handleMessage: ${error.message}`);
    }
  }

  /**
   * Fetches the server leaderboard ranking.
   */
  static async getLeaderboard(guildId, limit = 10) {
    const db = getDatabase();
    return await db.getLeaderboard(guildId, limit);
  }
}
