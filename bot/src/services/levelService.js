import { getDatabase } from '../database/index.js';
import { logger } from '../utils/logger.js';
import { botConfig } from '../config/botConfig.js';

export class LevelService {
  /**
   * Calculates user's achieved level based on their total XP and the server's custom level thresholds table.
   * If member has 400 XP and thresholds are L1=100, L2=250, L3=500 -> Returns Level 2.
   * If member has 500 XP -> Returns Level 3.
   * If member has 700 XP -> Stays Level 3 until next level threshold is reached.
   */
  static calculateLevel(totalXp, thresholds) {
    if (!thresholds || thresholds.length === 0) return 0;
    const sorted = [...thresholds].sort((a, b) => a.level - b.level);
    let achievedLevel = 0;
    for (const item of sorted) {
      if (totalXp >= item.requiredXp) {
        if (item.level > achievedLevel) {
          achievedLevel = item.level;
        }
      }
    }
    return achievedLevel;
  }

  /**
   * Helper to retrieve details on the next level requirements and progress percentage.
   */
  static getNextLevelDetails(totalXp, currentLevel, thresholds) {
    if (!thresholds || thresholds.length === 0) {
      return { nextLevel: null, requiredXp: null, neededXp: 0, progressPercent: 100 };
    }
    const sorted = [...thresholds].sort((a, b) => a.level - b.level);
    const next = sorted.find(t => t.level > currentLevel);
    if (!next) {
      return { nextLevel: null, requiredXp: null, neededXp: 0, progressPercent: 100 };
    }
    
    // Find current level's required XP (base for progress)
    const currentThreshold = sorted.find(t => t.level === currentLevel);
    const baseCurrentXp = currentThreshold ? currentThreshold.requiredXp : 0;
    const range = next.requiredXp - baseCurrentXp;
    const currentProgress = Math.max(0, totalXp - baseCurrentXp);
    const progressPercent = range > 0 ? Math.min(100, Math.floor((currentProgress / range) * 100)) : 100;

    return {
      nextLevel: next.level,
      requiredXp: next.requiredXp,
      neededXp: Math.max(0, next.requiredXp - totalXp),
      progressPercent
    };
  }

  /**
   * Handles messageCreate event to award XP and evaluate level-up and auto-roles.
   */
  static async handleMessage(message) {
    if (!message.guild || message.author.bot) return;

    try {
      const db = getDatabase();
      const guildId = message.guild.id;
      const userId = message.author.id;

      const config = await db.getGuildConfig(guildId);

      // 1. Check if leveling is enabled
      if (config.levelingEnabled === false) {
        return;
      }

      // 2. Cooldown check
      const cooldownSeconds = config.xpCooldownSeconds !== undefined ? parseInt(config.xpCooldownSeconds, 10) : 60;
      const now = Date.now();
      const userStats = await db.getUserLevel(guildId, userId);

      if (userStats.lastXpEarned && (now - userStats.lastXpEarned < cooldownSeconds * 1000)) {
        return; // Message sent within cooldown window
      }

      // 3. Fixed XP per message (no random variance)
      const xpPerMessage = parseInt(config.xpPerMessage, 10) || botConfig.defaults.xpPerMessage || 10;
      const newTotalXp = (userStats.xp || 0) + xpPerMessage;

      // 4. Fetch custom Level XP Table
      const thresholds = await db.getLevelThresholds(guildId);
      const oldLevel = userStats.level || 0;
      const newLevel = this.calculateLevel(newTotalXp, thresholds);
      const leveledUp = newLevel > oldLevel;

      // 5. Update user level in database
      await db.setUserLevel(guildId, userId, {
        xp: newTotalXp,
        level: newLevel,
        lastXpEarned: now,
        username: message.author.username
      });

      // 6. Handle Level-Up actions (Message and Auto-Roles)
      if (leveledUp) {
        logger.info(`User ${message.author.tag} leveled up to Level ${newLevel} (XP: ${newTotalXp}) in ${message.guild.name}`);

        // A. Auto Roles Evaluation
        try {
          await this.handleAutoRoles(message, newLevel, guildId, db);
        } catch (roleError) {
          logger.error(`Error processing level auto roles for ${message.author.tag}: ${roleError.message}`);
        }

        // B. Custom Level-Up Message
        if (config.levelupMessageEnabled !== false) {
          await this.sendLevelUpMessage(message, config, newLevel, newTotalXp);
        }
      }
    } catch (error) {
      logger.error(`Error in LevelService handleMessage: ${error.message}`);
    }
  }

  /**
   * Applies auto-roles according to level rules and role hierarchy.
   */
  static async handleAutoRoles(message, newLevel, guildId, db) {
    const rolesConfig = await db.getLevelRoles(guildId);
    if (!rolesConfig || rolesConfig.length === 0) return;

    const guild = message.guild;
    const botMember = guild.members.me;

    if (!botMember.permissions.has('ManageRoles')) {
      logger.warn(`Bot lacks ManageRoles permission in guild ${guild.id}, cannot assign level auto roles.`);
      return;
    }

    const member = message.member || await guild.members.fetch(message.author.id).catch(() => null);
    if (!member) return;

    // Rules matching the new level
    const targetRules = rolesConfig.filter(r => r.enabled && r.level === newLevel);

    for (const rule of targetRules) {
      // Find role by ID or Name
      const role = guild.roles.cache.get(rule.roleId) || 
                   guild.roles.cache.find(r => r.name === rule.roleName || r.id === rule.roleId);

      if (!role) {
        logger.warn(`Configured auto-role ID ${rule.roleId} (${rule.roleName}) not found in guild ${guild.id}`);
        continue;
      }

      // Check Discord Role Hierarchy
      if (botMember.roles.highest.position <= role.position) {
        logger.warn(`Cannot assign role '${role.name}': Role is higher than or equal to bot's highest role.`);
        continue;
      }

      // Add the role
      if (!member.roles.cache.has(role.id)) {
        await member.roles.add(role).catch(err => {
          logger.warn(`Failed to add role '${role.name}' to ${member.user.tag}: ${err.message}`);
        });
      }

      // If removePrevious is true: remove only previous level auto-roles
      if (rule.removePrevious) {
        const previousRules = rolesConfig.filter(r => r.enabled && r.level < newLevel);
        for (const prevRule of previousRules) {
          const prevRole = guild.roles.cache.get(prevRule.roleId) ||
                           guild.roles.cache.find(r => r.name === prevRule.roleName || r.id === prevRule.roleId);

          if (prevRole && prevRole.id !== role.id && member.roles.cache.has(prevRole.id)) {
            // Check hierarchy before removing
            if (botMember.roles.highest.position > prevRole.position) {
              await member.roles.remove(prevRole).catch(err => {
                logger.warn(`Failed to remove previous level role '${prevRole.name}' from ${member.user.tag}: ${err.message}`);
              });
            }
          }
        }
      }
    }
  }

  /**
   * Dispatches the customizable level-up notification.
   */
  static async sendLevelUpMessage(message, config, newLevel, totalXp) {
    try {
      const template = config.levelupMessage || 'مبروك {user}! وصلت للمستوى {level} 🎉';
      
      const formatted = template
        .replace(/{user}/g, `<@${message.author.id}>`)
        .replace(/{username}/g, message.author.username)
        .replace(/{level}/g, newLevel.toString())
        .replace(/{xp}/g, totalXp.toString())
        .replace(/{server}/g, message.guild.name);

      // Determine destination channel
      let targetChannel = message.channel;
      if (config.levelupChannelId && config.levelupChannelId !== 'same') {
        const configuredChannel = message.guild.channels.cache.get(config.levelupChannelId) ||
                                  message.guild.channels.cache.find(c => c.name === config.levelupChannelId || c.id === config.levelupChannelId);
        if (configuredChannel && configuredChannel.isTextBased()) {
          targetChannel = configuredChannel;
        }
      }

      await targetChannel.send({ content: formatted }).catch(err => {
        logger.warn(`Failed to send level up message in channel ${targetChannel.id}: ${err.message}`);
      });
    } catch (sendError) {
      logger.error(`Error sending level up message: ${sendError.message}`);
    }
  }

  /**
   * Fetches the server leaderboard ranking.
   */
  static async getLeaderboard(guildId, limit = 100) {
    const db = getDatabase();
    return await db.getLeaderboard(guildId, limit);
  }
}
