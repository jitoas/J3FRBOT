import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getDatabase } from '../../database/index.js';
import { createBaseEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('عرض إعدادات البوت الحالية للسيرفر')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const db = getDatabase();
    const config = await db.getGuildConfig(interaction.guildId);

    const welcomeChannel = config.welcomeChannelId ? `<#${config.welcomeChannelId}>` : '*غير محددة*';
    const logsChannel = config.logsChannelId ? `<#${config.logsChannelId}>` : '*غير محددة*';
    const commandsChannel = config.commandsChannelId ? `<#${config.commandsChannelId}>` : '*غير محددة (متاحة في جميع القنوات)*';

    const embed = createBaseEmbed({
      title: `⚙️ إعدادات البوت في سيرفر ${interaction.guild.name}`,
      description: 'هذه هي التهيئات الحالية للقنوات الثلاث المستقلة والنظام المخزن في قاعدة البيانات:',
      fields: [
        {
          name: '👋 قناة الترحيب (Welcome Channel)',
          value: `• **الحالة:** ${config.welcomeEnabled ? '🟢 مفعل' : '🔴 معطل'}\n• **القناة:** ${welcomeChannel}\n• **مسار الخلفية:** \`${config.welcomeBackgroundPath || './assets/welcome-bg.png'}\` *(خلفية مخصصة حرة بالكامل)*\n• **الصورة الشخصية (Avatar):** ${config.welcomeCardConfig?.avatar?.enabled !== false ? '🟢 مفعلة' : '🔴 معطلة'}\n• **اسم العضو (Username):** ${config.welcomeCardConfig?.username?.enabled !== false ? '🟢 مفعل' : '🔴 معطل'}\n• **النص الترحيبي:** ${config.welcomeCardConfig?.welcomeText?.enabled !== false ? `🟢 "${config.welcomeCardConfig?.welcomeText?.text || 'WELCOME'}"` : '🔴 معطل'}\n• **عداد الأعضاء:** ${config.welcomeCardConfig?.memberCount?.enabled ? '🟢 مفعل' : '🔴 مخفي'}\n• **الرسالة:** \`${config.welcomeMessage}\``,
          inline: false
        },
        {
          name: '📜 قناة السجلات (Logs Channel)',
          value: `• **الحالة:** ${config.logsEnabled ? '🟢 مفعل' : '🔴 معطل'}\n• **القناة:** ${logsChannel}`,
          inline: false
        },
        {
          name: '🤖 قناة أوامر الستاف (Bot Commands Channel)',
          value: `• **القناة المخصصة:** ${commandsChannel}\n• **الحالة:** ${config.commandsChannelId ? '🔒 محصورة في هذه القناة فقط' : '⚪ غير مقيدة (يمكن تحديدها عبر `/setcommands`)'}`,
          inline: false
        },
        {
          name: '⭐ نظام المستويات (Leveling Architecture)',
          value: `• **الحالة:** ${config.levelingEnabled ? '🟢 مفعل' : '⚪ معطل (جاهز للتفعيل)'}\n• **معدل XP:** \`${config.xpRate || 1.0}x\``,
          inline: false
        }
      ]
    });

    await interaction.editReply({ embeds: [embed] });
  }
};
