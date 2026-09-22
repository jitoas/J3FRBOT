import { Events, PermissionFlagsBits } from 'discord.js';
import { LevelService } from '../../services/levelService.js';
import { ModerationService } from '../../services/moderationService.js';
import { createSuccessEmbed, createErrorEmbed } from '../../utils/embedBuilder.js';
import { checkCommandsChannel } from '../../utils/permissions.js';
import { logger } from '../../utils/logger.js';

export default {
  name: Events.MessageCreate,
  async execute(message) {
    if (!message.guild || message.author.bot) return;

    // 1. Process Leveling/XP system hook
    await LevelService.handleMessage(message);

    // 2. Process Prefix Commands (e.g. ti @user 10m reason or !ti @user 10m reason)
    const content = message.content.trim();
    const isTiPrefix = content.startsWith('!ti ') || content.startsWith('ti ') || content === 'ti' || content === '!ti';

    if (isTiPrefix) {
      try {
        // Channel restriction verification
        const channelCheck = await checkCommandsChannel(message.guild.id, message.channel.id);
        if (!channelCheck.allowed) {
          const channelErrorEmbed = createErrorEmbed(
            'قناة غير مخصصة للأوامر',
            channelCheck.reason || `⚠️ أوامر الإدارة والبوت مسموحة فقط في قناة <#${channelCheck.commandsChannelId}>.`
          );
          return message.reply({ embeds: [channelErrorEmbed] });
        }

        const parts = content.split(/\s+/);
        // parts[0] is command ('ti' or '!ti')
        if (parts.length < 3) {
          const usageEmbed = createErrorEmbed(
            'طريقة استخدام أمر العزل (Timeout)',
            'يرجى كتابة الأمر بالصيغة التالية:\n`ti @user 10m [السبب]`\nأو\n`!ti <UserID> 1h [السبب]`\n\n**الوحدات المدعومة:** `s` (ثوانٍ), `m` (دقائق), `h` (ساعات), `d` (أيام).'
          );
          return message.reply({ embeds: [usageEmbed] });
        }

        // Target user extraction (mention or ID)
        const targetMention = message.mentions.users.first();
        const targetId = targetMention ? targetMention.id : parts[1].replace(/[<@!>]/g, '');
        const targetUser = targetMention || await message.client.users.fetch(targetId).catch(() => null);

        if (!targetUser) {
          return message.reply({
            embeds: [createErrorEmbed('خطأ', 'لم يتم العثور على العضو المحدد. تأكد من عمل منشن صحيح أو وضع المعرّف (ID).')]
          });
        }

        const durationStr = parts[2];
        const reason = parts.slice(3).join(' ') || 'لم يتم تحديد سبب';

        // Fake interaction-like context for hierarchy and response
        const context = {
          guild: message.guild,
          member: message.member,
          user: message.author,
          author: message.author
        };

        const result = await ModerationService.timeoutMember(context, targetUser, durationStr, reason);

        if (!result.success) {
          return message.reply({ embeds: [createErrorEmbed('فشل تنفيذ التايم أوت', result.message)] });
        }

        const successEmbed = createSuccessEmbed(
          'تم العزل المؤقت بنجاح (Timeout)',
          `**العضو:** ${targetUser} (\`${targetUser.tag}\`)\n**المدة:** \`${result.durationLabel}\`\n**السبب:** ${reason}\n**المشرف:** ${message.author}`
        );

        await message.reply({ embeds: [successEmbed] });
      } catch (err) {
        logger.error(`Error handling ti prefix command: ${err.message}`);
      }
    }
  }
};

