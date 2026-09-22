import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { ModerationService } from '../../services/moderationService.js';
import { createSuccessEmbed, createErrorEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('حظر عضو من السيرفر نهائيًا (Ban Member)')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setDMPermission(false)
    .addUserOption(option =>
      option
        .setName('target')
        .setDescription('العضو المراد حظره')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('سبب الحظر')
        .setRequired(false)
    )
    .addIntegerOption(option =>
      option
        .setName('days')
        .setDescription('عدد أيام حذف رسائل العضو (0 إلى 7)')
        .setMinValue(0)
        .setMaxValue(7)
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const targetUser = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason') || 'لم يتم تحديد سبب';
    const days = interaction.options.getInteger('days') || 0;

    const result = await ModerationService.banMember(interaction, targetUser, reason, days);

    if (result.success) {
      const embed = createSuccessEmbed(
        'تم حظر العضو بنجاح',
        `**العضو:** ${targetUser.tag} (\`${targetUser.id}\`)\n**السبب:** ${reason}\n**حذف رسائل سابقة:** ${days} يوم\n**المشرف:** ${interaction.user.tag}`
      );
      await interaction.editReply({ embeds: [embed] });
    } else {
      const embed = createErrorEmbed('فشل حظر العضو', result.message);
      await interaction.editReply({ embeds: [embed] });
    }
  }
};
