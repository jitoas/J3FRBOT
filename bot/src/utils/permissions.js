import { PermissionFlagsBits } from 'discord.js';
import { getDatabase } from '../database/index.js';

/**
 * Checks if a staff or moderation command is being executed in the designated commands channel.
 * If commandsChannelId is configured and the channel differs, rejects execution.
 */
export const checkCommandsChannel = async (guildId, channelId) => {
  if (!guildId) return { allowed: true };
  
  try {
    const db = getDatabase();
    const config = await db.getGuildConfig(guildId);
    
    if (config.commandsChannelId && config.commandsChannelId !== channelId) {
      return {
        allowed: false,
        commandsChannelId: config.commandsChannelId,
        reason: `⚠️ أوامر الإدارة والبوت مسموحة فقط في قناة <#${config.commandsChannelId}>.`
      };
    }
  } catch (error) {
    // If DB fails, do not crash, allow execution
    return { allowed: true };
  }

  return { allowed: true };
};

/**
 * Checks if the bot and the invoking moderator have the required permissions
 * and role hierarchy position to moderate a target member.
 */
export const checkModerationHierarchy = (interaction, targetMember, requiredPermission) => {
  const { member: issuer, guild } = interaction;
  const botMember = guild.members.me;

  // 1. Verify Issuer has the required Permission
  if (!issuer.permissions.has(requiredPermission) && issuer.id !== guild.ownerId) {
    return {
      allowed: false,
      reason: 'ليس لديك الصلاحيات الكافية لاستخدام هذا الأمر.'
    };
  }

  // 2. Verify Bot has the required Permission
  if (!botMember.permissions.has(requiredPermission)) {
    return {
      allowed: false,
      reason: 'البوت لا يمتلك الصلاحيات المطلوبة لتنفيذ هذه العملية في السيرفر.'
    };
  }

  // If target member is in guild, check hierarchy:
  if (targetMember) {
    // 3. Cannot moderate server owner
    if (targetMember.id === guild.ownerId) {
      return {
        allowed: false,
        reason: 'لا يمكن اتخاذ إجراء تأديبي ضد مالك السيرفر.'
      };
    }

    // 4. Cannot moderate oneself
    if (targetMember.id === issuer.id) {
      return {
        allowed: false,
        reason: 'لا يمكنك معاقبة نفسك.'
      };
    }

    // 5. Cannot moderate the bot itself
    if (targetMember.id === botMember.id) {
      return {
        allowed: false,
        reason: 'لا يمكن للبوت اتخاذ إجراء تأديبي ضد نفسه.'
      };
    }

    // 6. Role hierarchy: Issuer vs Target
    if (issuer.id !== guild.ownerId && issuer.roles.highest.position <= targetMember.roles.highest.position) {
      return {
        allowed: false,
        reason: 'لا يمكنك معاقبة عضو يمتلك رتبة أعلى منك أو مساوية لرتبتك.'
      };
    }

    // 7. Role hierarchy: Bot vs Target
    if (botMember.roles.highest.position <= targetMember.roles.highest.position) {
      return {
        allowed: false,
        reason: 'رتبة البوت أدنى من رتبة العضو المستهدف أو مساوية لها، يرجى رفع رتبة البوت أعلى منه.'
      };
    }
  }

  return {
    allowed: true,
    reason: null
  };
};
