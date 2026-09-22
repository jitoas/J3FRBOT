import { PermissionFlagsBits } from 'discord.js';
import { checkModerationHierarchy } from '../utils/permissions.js';
import { LoggingService } from './loggingService.js';
import { logger } from '../utils/logger.js';

export class ModerationService {
  /**
   * Helper function to parse duration string (s, m, h, d) into milliseconds.
   * Max 28 days supported by Discord API.
   */
  static parseDuration(durationStr) {
    if (!durationStr) return null;
    const regex = /^(\d+)\s*(s|sec|seconds?|m|min|minutes?|h|hr|hours?|d|days?)$/i;
    const match = durationStr.trim().match(regex);
    if (!match) return null;

    const amount = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();

    if (isNaN(amount) || amount <= 0) return null;

    let ms = 0;
    let label = '';

    if (unit.startsWith('s')) {
      ms = amount * 1000;
      label = `${amount} ثانية`;
    } else if (unit.startsWith('m')) {
      ms = amount * 60 * 1000;
      label = `${amount} دقيقة`;
    } else if (unit.startsWith('h')) {
      ms = amount * 60 * 60 * 1000;
      label = `${amount} ساعة`;
    } else if (unit.startsWith('d')) {
      ms = amount * 24 * 60 * 60 * 1000;
      label = `${amount} يوم`;
    }

    const maxMs = 28 * 24 * 60 * 60 * 1000; // 28 days max
    if (ms > maxMs) {
      return { valid: false, error: 'الحد الأقصى للعزل المؤقت (Timeout) هو 28 يومًا.' };
    }
    if (ms < 5000) {
      return { valid: false, error: 'الحد الأدنى للعزل المؤقت هو 5 ثوانٍ.' };
    }

    return { valid: true, ms, label };
  }

  /**
   * Applies a timeout (mute/communication disabled) to a member.
   */
  static async timeoutMember(context, targetUser, durationStr = '10m', reason = 'لم يتم تحديد سبب') {
    const guild = context.guild;
    const issuer = context.user || context.author;
    const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);

    if (!targetMember) {
      return {
        success: false,
        message: 'العضو المحدد غير موجود في هذا السيرفر.'
      };
    }

    const check = checkModerationHierarchy(context, targetMember, PermissionFlagsBits.ModerateMembers);
    if (!check.allowed) {
      return {
        success: false,
        message: check.reason
      };
    }

    const parsed = this.parseDuration(durationStr);
    if (!parsed || !parsed.valid) {
      return {
        success: false,
        message: parsed?.error || 'صيغة الوقت غير صالحة. استخدم أرقاماً متبوعة بـ s (ثواني) أو m (دقائق) أو h (ساعات) أو d (أيام). مثال: `10m` أو `2h`.'
      };
    }

    try {
      // Optional DM to member before timeout
      await targetUser.send({
        content: `تم عزل حسابك مؤقتًا (Timeout) في سيرفر **${guild.name}** لمدة **${parsed.label}**.\n**السبب:** ${reason}`
      }).catch(() => {});

      await targetMember.timeout(parsed.ms, `${issuer.tag}: ${reason}`);

      logger.info(`Member ${targetUser.tag} timed out for ${parsed.label} in ${guild.name} by ${issuer.tag}. Reason: ${reason}`);

      // Log via LoggingService
      await LoggingService.logTimeout({
        guild,
        targetUser,
        executor: issuer,
        durationLabel: parsed.label,
        reason
      });

      return {
        success: true,
        message: `تم عزل العضو **${targetUser.tag}** مؤقتًا لمدة **${parsed.label}** بنجاح.`,
        targetUser,
        durationLabel: parsed.label,
        reason
      };
    } catch (error) {
      logger.error(`Error timing out member ${targetUser.id}: ${error.message}`);
      return {
        success: false,
        message: `حدث خطأ أثناء تنفيذ العزل المؤقت: ${error.message}`
      };
    }
  }

  /**
   * Kicks a member from the guild after performing rigorous permission & hierarchy checks.
   */
  static async kickMember(interaction, targetUser, reason = 'لم يتم تحديد سبب') {
    const { guild } = interaction;
    const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);

    if (!targetMember) {
      return {
        success: false,
        message: 'العضو المحدد غير موجود في هذا السيرفر.'
      };
    }

    const check = checkModerationHierarchy(interaction, targetMember, PermissionFlagsBits.KickMembers);
    if (!check.allowed) {
      return {
        success: false,
        message: check.reason
      };
    }

    try {
      // Optional DM to member before kicking
      await targetUser.send({
        content: `تم طردك من سيرفر **${guild.name}**.\n**السبب:** ${reason}`
      }).catch(() => {
        // Safe ignore if member DMs are closed
      });

      await targetMember.kick(`${interaction.user.tag}: ${reason}`);

      logger.info(`Member ${targetUser.tag} kicked from ${guild.name} by ${interaction.user.tag}. Reason: ${reason}`);

      return {
        success: true,
        message: `تم طرد العضو **${targetUser.tag}** بنجاح.`,
        targetUser,
        reason
      };
    } catch (error) {
      logger.error(`Error kicking member ${targetUser.id}: ${error.message}`);
      return {
        success: false,
        message: `حدث خطأ أثناء محاولة الطرد: ${error.message}`
      };
    }
  }

  /**
   * Bans a member from the guild with optional message deletion days and hierarchy checks.
   */
  static async banMember(interaction, targetUser, reason = 'لم يتم تحديد سبب', deleteMessageDays = 0) {
    const { guild } = interaction;
    const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);

    const check = checkModerationHierarchy(interaction, targetMember, PermissionFlagsBits.BanMembers);
    if (!check.allowed) {
      return {
        success: false,
        message: check.reason
      };
    }

    try {
      // Optional DM to user before banning
      await targetUser.send({
        content: `تم حظرك نهائيًا من سيرفر **${guild.name}**.\n**السبب:** ${reason}`
      }).catch(() => {});

      await guild.bans.create(targetUser.id, {
        reason: `${interaction.user.tag}: ${reason}`,
        deleteMessageSeconds: deleteMessageDays * 24 * 60 * 60
      });

      logger.info(`Member ${targetUser.tag} banned from ${guild.name} by ${interaction.user.tag}. Reason: ${reason}`);

      return {
        success: true,
        message: `تم حظر العضو **${targetUser.tag}** بنجاح من السيرفر.`,
        targetUser,
        reason
      };
    } catch (error) {
      logger.error(`Error banning member ${targetUser.id}: ${error.message}`);
      return {
        success: false,
        message: `حدث خطأ أثناء تنفيذ الحظر: ${error.message}`
      };
    }
  }

  /**
   * Unbans a previously banned user by User ID.
   */
  static async unbanMember(interaction, userId, reason = 'لم يتم تحديد سبب') {
    const { guild, member: issuer } = interaction;
    const botMember = guild.members.me;

    if (!issuer.permissions.has(PermissionFlagsBits.BanMembers) && issuer.id !== guild.ownerId) {
      return {
        success: false,
        message: 'ليس لديك صلاحية حظر/فك حظر الأعضاء (Ban Members).'
      };
    }

    if (!botMember.permissions.has(PermissionFlagsBits.BanMembers)) {
      return {
        success: false,
        message: 'البوت لا يمتلك صلاحية Ban Members في السيرفر.'
      };
    }

    try {
      const banInfo = await guild.bans.fetch(userId).catch(() => null);
      if (!banInfo) {
        return {
          success: false,
          message: 'هذا العضو غير محظور في السيرفر أو أن المعرّف (ID) غير صحيح.'
        };
      }

      await guild.bans.remove(userId, `${interaction.user.tag}: ${reason}`);

      logger.info(`User ${userId} unbanned in ${guild.name} by ${interaction.user.tag}`);

      return {
        success: true,
        message: `تم إلغاء حظر العضو **${banInfo.user.tag}** بنجاح.`,
        targetUser: banInfo.user,
        reason
      };
    } catch (error) {
      logger.error(`Error unbanning user ${userId}: ${error.message}`);
      return {
        success: false,
        message: `حدث خطأ أثناء فك الحظر: ${error.message}`
      };
    }
  }
}
