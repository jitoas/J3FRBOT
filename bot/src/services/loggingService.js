import { AuditLogEvent } from 'discord.js';
import { getDatabase } from '../database/index.js';
import { createLogEmbed } from '../utils/embedBuilder.js';
import { fetchRecentAuditLog } from '../utils/auditLogs.js';
import { logger } from '../utils/logger.js';

export class LoggingService {
  /**
   * Retrieves the configured logs channel for a guild, if enabled.
   */
  static async getLogsChannel(guild) {
    if (!guild) return null;
    try {
      const db = getDatabase();
      const config = await db.getGuildConfig(guild.id);

      if (!config.logsEnabled || !config.logsChannelId) {
        return null;
      }

      const targetChannel = config.logsChannelId;
      const channel = guild.channels.cache.get(targetChannel) || 
                      guild.channels.cache.find(c => c.name === targetChannel || c.name.toLowerCase() === targetChannel.toLowerCase()) ||
                      (/^\d+$/.test(targetChannel) ? await guild.channels.fetch(targetChannel).catch(() => null) : null);

      if (!channel || !channel.isTextBased()) {
        return null;
      }

      // Check bot permissions in target channel
      const botMember = guild.members.me;
      if (!channel.permissionsFor(botMember).has(['ViewChannel', 'SendMessages', 'EmbedLinks'])) {
        logger.warn(`Bot lacks Send/Embed permissions in logs channel ${channel.id} of guild ${guild.id}`);
        return null;
      }

      return channel;
    } catch (error) {
      logger.error(`Error retrieving logs channel for guild ${guild.id}: ${error.message}`);
      return null;
    }
  }

  /**
   * Dispatches a formatted log embed to the server's logs channel.
   */
  static async sendLog(guild, logData) {
    try {
      const logsChannel = await this.getLogsChannel(guild);
      if (!logsChannel) return;

      const embed = createLogEmbed(logData);
      await logsChannel.send({ embeds: [embed] });
    } catch (error) {
      logger.error(`Failed to send log in guild ${guild?.id}: ${error.message}`);
    }
  }

  // --- SPECIFIC EVENT LOGGERS ---

  static async logMemberJoin(member) {
    const accountAgeDays = Math.floor((Date.now() - member.user.createdTimestamp) / (1000 * 60 * 60 * 24));
    await this.sendLog(member.guild, {
      eventType: 'انضمام عضو (Member Join)',
      title: '📥 انضمام عضو جديد إلى السيرفر',
      description: `انضم ${member.user} إلى السيرفر.`,
      color: 0x57F287, // Green
      user: member.user,
      fields: [
        { name: '👤 العضو', value: `${member.user.tag} (\`${member.user.id}\`)`, inline: true },
        { name: '📅 عمر الحساب', value: `${accountAgeDays} يوم`, inline: true },
        { name: '👥 عدد الأعضاء الحالي', value: `${member.guild.memberCount}`, inline: true }
      ]
    });
  }

  static async logMemberLeaveOrKick(member) {
    // Check if leave was caused by a kick
    const kickEntry = await fetchRecentAuditLog(member.guild, AuditLogEvent.MemberKick, member.id);

    if (kickEntry) {
      await this.sendLog(member.guild, {
        eventType: 'طرد عضو (Member Kick)',
        title: '👢 تم طرد عضو من السيرفر',
        description: `تم طرد ${member.user.tag} بواسطة المشرف.`,
        color: 0xFEE75C, // Yellow
        user: member.user,
        executor: kickEntry.executor,
        fields: [
          { name: '👤 العضو المطرود', value: `${member.user.tag} (\`${member.user.id}\`)`, inline: true },
          { name: '📝 السبب', value: kickEntry.reason || 'لم يتم تحديد سبب', inline: false }
        ]
      });
    } else {
      await this.sendLog(member.guild, {
        eventType: 'مغادرة عضو (Member Leave)',
        title: '📤 غادر عضو السيرفر',
        description: `غادر ${member.user.tag} السيرفر.`,
        color: 0xED4245, // Red
        user: member.user,
        fields: [
          { name: '👤 العضو', value: `${member.user.tag} (\`${member.user.id}\`)`, inline: true },
          { name: '👥 عدد الأعضاء المتبقي', value: `${member.guild.memberCount}`, inline: true }
        ]
      });
    }
  }

  static async logBan(ban) {
    const banEntry = await fetchRecentAuditLog(ban.guild, AuditLogEvent.MemberBanAdd, ban.user.id);
    await this.sendLog(ban.guild, {
      eventType: 'حظر عضو (Member Ban)',
      title: '🔨 تم حظر عضو من السيرفر',
      description: `تم حظر ${ban.user.tag} من السيرفر.`,
      color: 0xED4245, // Dark Red
      user: ban.user,
      executor: banEntry?.executor,
      fields: [
        { name: '👤 العضو المحظور', value: `${ban.user.tag} (\`${ban.user.id}\`)`, inline: true },
        { name: '📝 السبب', value: ban.reason || banEntry?.reason || 'لم يتم تحديد سبب', inline: false }
      ]
    });
  }

  static async logUnban(ban) {
    const unbanEntry = await fetchRecentAuditLog(ban.guild, AuditLogEvent.MemberBanRemove, ban.user.id);
    await this.sendLog(ban.guild, {
      eventType: 'إلغاء حظر (Member Unban)',
      title: '🔓 تم إلغاء حظر عضو',
      description: `تم فك الحظر عن ${ban.user.tag}.`,
      color: 0x57F287, // Green
      user: ban.user,
      executor: unbanEntry?.executor,
      fields: [
        { name: '👤 العضو', value: `${ban.user.tag} (\`${ban.user.id}\`)`, inline: true }
      ]
    });
  }

  static async logMessageDelete(message) {
    if (!message.guild || message.author?.bot) return;

    // Safe sanitized message snippet (truncated to prevent massive logs or sensitive leakage)
    const rawContent = message.cleanContent || message.content || '(لا يوجد محتوى نصي / قد يحتوي على مرفق)';
    const sanitizedContent = rawContent.length > 500 ? rawContent.substring(0, 497) + '...' : rawContent;

    const deleteEntry = await fetchRecentAuditLog(message.guild, AuditLogEvent.MessageDelete, message.author?.id);

    await this.sendLog(message.guild, {
      eventType: 'حذف رسالة (Message Delete)',
      title: '🗑️ تم حذف رسالة',
      description: `تم حذف رسالة أرسلها ${message.author || 'عضو غير معروف'} في القناة ${message.channel}.`,
      color: 0xED4245,
      user: message.author,
      executor: deleteEntry?.executor,
      fields: [
        { name: '💬 القناة', value: `${message.channel} (\`${message.channel.id}\`)`, inline: true },
        { name: '👤 صاحب الرسالة', value: message.author ? `${message.author.tag} (\`${message.author.id}\`)` : 'غير معروف', inline: true },
        { name: '📄 محتوى الرسالة المحذوفة', value: `\`\`\`\n${sanitizedContent}\n\`\`\``, inline: false }
      ]
    });
  }

  static async logMessageUpdate(oldMessage, newMessage) {
    if (!oldMessage.guild || oldMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return; // Ignore embed-only updates or pin changes

    const oldText = oldMessage.content ? (oldMessage.content.length > 300 ? oldMessage.content.substring(0, 297) + '...' : oldMessage.content) : '(فارغ)';
    const newText = newMessage.content ? (newMessage.content.length > 300 ? newMessage.content.substring(0, 297) + '...' : newMessage.content) : '(فارغ)';

    await this.sendLog(oldMessage.guild, {
      eventType: 'تعديل رسالة (Message Edit)',
      title: '✏️ تم تعديل رسالة',
      description: `قام ${oldMessage.author} بتعديل رسالته في القناة ${oldMessage.channel}. [الانتقال للرسالة](${newMessage.url})`,
      color: 0x5865F2,
      user: oldMessage.author,
      fields: [
        { name: '💬 القناة', value: `${oldMessage.channel} (\`${oldMessage.channel.id}\`)`, inline: true },
        { name: '👤 صاحب الرسالة', value: `${oldMessage.author.tag} (\`${oldMessage.author.id}\`)`, inline: true },
        { name: '🔴 المحتوى السابق', value: `\`\`\`\n${oldText}\n\`\`\``, inline: false },
        { name: '🟢 المحتوى الجديد', value: `\`\`\`\n${newText}\n\`\`\``, inline: false }
      ]
    });
  }

  static async logRoleCreate(role) {
    const entry = await fetchRecentAuditLog(role.guild, AuditLogEvent.RoleCreate, role.id);
    await this.sendLog(role.guild, {
      eventType: 'إنشاء رتبة (Role Create)',
      title: '🎭 تم إنشاء رتبة جديدة',
      description: `تم إنشاء الرتبة **${role.name}** (\`${role.id}\`).`,
      color: role.color || 0x57F287,
      executor: entry?.executor,
      fields: [
        { name: '🎨 اللون', value: role.hexColor, inline: true },
        { name: '📌 Hoist (منفصلة)', value: role.hoist ? 'نعم' : 'لا', inline: true }
      ]
    });
  }

  static async logRoleDelete(role) {
    const entry = await fetchRecentAuditLog(role.guild, AuditLogEvent.RoleDelete, role.id);
    await this.sendLog(role.guild, {
      eventType: 'حذف رتبة (Role Delete)',
      title: '🗑️ تم حذف رتبة',
      description: `تم حذف الرتبة **${role.name}** (\`${role.id}\`).`,
      color: 0xED4245,
      executor: entry?.executor
    });
  }

  static async logRoleUpdate(oldRole, newRole) {
    const changes = [];
    if (oldRole.name !== newRole.name) {
      changes.push(`**الاسم:** \`${oldRole.name}\` ➔ \`${newRole.name}\``);
    }
    if (oldRole.hexColor !== newRole.hexColor) {
      changes.push(`**اللون:** \`${oldRole.hexColor}\` ➔ \`${newRole.hexColor}\``);
    }
    if (oldRole.permissions.bitfield !== newRole.permissions.bitfield) {
      changes.push('**تم تعديل أذونات وصلاحيات الرتبة**');
    }

    if (changes.length === 0) return;

    const entry = await fetchRecentAuditLog(oldRole.guild, AuditLogEvent.RoleUpdate, newRole.id);
    await this.sendLog(oldRole.guild, {
      eventType: 'تعديل رتبة (Role Update)',
      title: '⚙️ تم تعديل رتبة',
      description: `تم تعديل بيانات الرتبة **${newRole.name}** (\`${newRole.id}\`).`,
      color: newRole.color || 0xFEE75C,
      executor: entry?.executor,
      fields: [
        { name: '📝 التغييرات', value: changes.join('\n'), inline: false }
      ]
    });
  }

  static async logChannelCreate(channel) {
    if (!channel.guild) return;
    const entry = await fetchRecentAuditLog(channel.guild, AuditLogEvent.ChannelCreate, channel.id);
    await this.sendLog(channel.guild, {
      eventType: 'إنشاء قناة (Channel Create)',
      title: '📁 تم إنشاء قناة جديدة',
      description: `تم إنشاء القناة ${channel} (\`${channel.id}\`).`,
      color: 0x57F287,
      executor: entry?.executor,
      fields: [
        { name: '🏷️ النوع', value: `${channel.type}`, inline: true },
        { name: '📂 التصنيف (Category)', value: channel.parent ? channel.parent.name : 'بدون تصنيف', inline: true }
      ]
    });
  }

  static async logChannelDelete(channel) {
    if (!channel.guild) return;
    const entry = await fetchRecentAuditLog(channel.guild, AuditLogEvent.ChannelDelete, channel.id);
    await this.sendLog(channel.guild, {
      eventType: 'حذف قناة (Channel Delete)',
      title: '🗑️ تم حذف قناة',
      description: `تم حذف القناة **#${channel.name}** (\`${channel.id}\`).`,
      color: 0xED4245,
      executor: entry?.executor
    });
  }

  static async logChannelUpdate(oldChannel, newChannel) {
    if (!oldChannel.guild) return;
    const changes = [];
    if (oldChannel.name !== newChannel.name) {
      changes.push(`**الاسم:** \`#${oldChannel.name}\` ➔ \`#${newChannel.name}\``);
    }
    if (oldChannel.topic !== newChannel.topic) {
      changes.push(`**الوصف (Topic):** تم تحديث الوصف`);
    }

    if (changes.length === 0) return;

    const entry = await fetchRecentAuditLog(oldChannel.guild, AuditLogEvent.ChannelUpdate, newChannel.id);
    await this.sendLog(oldChannel.guild, {
      eventType: 'تعديل قناة (Channel Update)',
      title: '⚙️ تم تعديل قناة',
      description: `تم تعديل إعدادات القناة ${newChannel} (\`${newChannel.id}\`).`,
      color: 0xFEE75C,
      executor: entry?.executor,
      fields: [
        { name: '📝 التغييرات', value: changes.join('\n'), inline: false }
      ]
    });
  }

  static async logGuildUpdate(oldGuild, newGuild) {
    const changes = [];
    if (oldGuild.name !== newGuild.name) {
      changes.push(`**اسم السيرفر:** \`${oldGuild.name}\` ➔ \`${newGuild.name}\``);
    }
    if (oldGuild.iconURL() !== newGuild.iconURL()) {
      changes.push('**تم تغيير أيقونة السيرفر (Server Icon)**');
    }

    if (changes.length === 0) return;

    const entry = await fetchRecentAuditLog(oldGuild, AuditLogEvent.GuildUpdate);
    await this.sendLog(oldGuild, {
      eventType: 'تحديث السيرفر (Guild Update)',
      title: '🌐 تم تحديث بيانات السيرفر',
      description: `تم تحديث معلومات السيرفر **${newGuild.name}**.`,
      color: 0x5865F2,
      executor: entry?.executor,
      fields: [
        { name: '📝 التغييرات', value: changes.join('\n'), inline: false }
      ]
    });
  }

  static async logVoiceStateUpdate(oldState, newState) {
    const member = newState.member || oldState.member;
    if (!member || member.user.bot) return;

    const guild = newState.guild || oldState.guild;

    // Case 1: Joined a voice channel
    if (!oldState.channelId && newState.channelId) {
      await this.sendLog(guild, {
        eventType: 'دخول قناة صوتية (Voice Join)',
        title: '🔊 دخول قناة صوتية',
        description: `انضم ${member.user} إلى القناة الصوتية **${newState.channel.name}**.`,
        color: 0x57F287,
        user: member.user,
        fields: [
          { name: '🎙️ القناة', value: `${newState.channel.name} (\`${newState.channel.id}\`)`, inline: true }
        ]
      });
    }
    // Case 2: Left a voice channel
    else if (oldState.channelId && !newState.channelId) {
      await this.sendLog(guild, {
        eventType: 'مغادرة قناة صوتية (Voice Leave)',
        title: '🔇 مغادرة قناة صوتية',
        description: `غادر ${member.user} القناة الصوتية **${oldState.channel.name}**.`,
        color: 0xED4245,
        user: member.user,
        fields: [
          { name: '🎙️ القناة', value: `${oldState.channel.name} (\`${oldState.channel.id}\`)`, inline: true }
        ]
      });
    }
    // Case 3: Switched voice channels
    else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
      await this.sendLog(guild, {
        eventType: 'تبديل قناة صوتية (Voice Switch)',
        title: '🔀 تبديل قناة صوتية',
        description: `انتقل ${member.user} من **${oldState.channel.name}** إلى **${newState.channel.name}**.`,
        color: 0x5865F2,
        user: member.user,
        fields: [
          { name: '⬅️ القناة السابقة', value: `${oldState.channel.name}`, inline: true },
          { name: '➡️ القناة الجديدة', value: `${newState.channel.name}`, inline: true }
        ]
      });
    }
  }

  static async logTimeout({ guild, targetUser, executor, durationLabel, reason }) {
    await this.sendLog(guild, {
      eventType: 'عزل مؤقت (Member Timeout)',
      title: '⏳ تم تطبيق عزل مؤقت لعضو',
      description: `تم إعطاء تايم أوت لـ ${targetUser} بواسطة ${executor}.`,
      color: 0xFEE75C, // Yellow
      user: targetUser,
      executor: executor,
      fields: [
        { name: '👤 العضو المعزول', value: `${targetUser.tag} (\`${targetUser.id}\`)`, inline: true },
        { name: '⏱️ المدة', value: durationLabel, inline: true },
        { name: '📝 السبب', value: reason || 'لم يتم تحديد سبب', inline: false }
      ]
    });
  }

  static async logBotJoin(guild) {
    logger.info(`Bot successfully joined new server: ${guild.name} (${guild.id}) with ${guild.memberCount} members.`);
  }
}
