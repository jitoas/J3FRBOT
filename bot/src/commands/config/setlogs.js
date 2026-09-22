import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { getDatabase } from '../../database/index.js';
import { createSuccessEmbed, createErrorEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setlogs')
    .setDescription('إعداد قناة سجلات الأحداث (Logs Channel)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false)
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('قناة السجلات')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addBooleanOption(option =>
      option
        .setName('enabled')
        .setDescription('تفعيل أو تعطيل السجلات')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const channel = interaction.options.getChannel('channel');
    const enabled = interaction.options.getBoolean('enabled') ?? true;

    const db = getDatabase();
    await db.setGuildConfig(interaction.guildId, {
      logsChannelId: channel.id,
      logsEnabled: enabled
    });

    const embed = createSuccessEmbed(
      'تم تحديث إعدادات السجلات (Logs)',
      `**القناة:** ${channel}\n**الحالة:** ${enabled ? '🟢 مفعل' : '🔴 معطل'}\n\nسيتم إرسال كافة سجلات الأعضاء، الرسائل، القنوات، الرتب، والقنوات الصوتية إلى هذه القناة فور حدوثها.`
    );

    await interaction.editReply({ embeds: [embed] });
  }
};
