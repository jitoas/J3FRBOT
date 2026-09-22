import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { ModerationService } from '../../services/moderationService.js';
import { createSuccessEmbed, createErrorEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('إلغاء حظر عضو بواسطة ID (Unban Member)')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setDMPermission(false)
    .addStringOption(option =>
      option
        .setName('user_id')
        .setDescription('معرّف العضو المراد فك الحظر عنه (User ID)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('سبب فك الحظر')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const userId = interaction.options.getString('user_id').trim();
    const reason = interaction.options.getString('reason') || 'لم يتم تحديد سبب';

    // Verify format is numeric ID
    if (!/^\d{17,20}$/.test(userId)) {
      const embed = createErrorEmbed('معرّف غير صالح', 'يرجى كتابة معرّف صحيح للمستخدم (User ID يتكون من 17-20 رقم).');
      return interaction.editReply({ embeds: [embed] });
    }

    const result = await ModerationService.unbanMember(interaction, userId, reason);

    if (result.success) {
      const embed = createSuccessEmbed(
        'تم فك الحظر بنجاح',
        `**العضو:** ${result.targetUser.tag} (\`${result.targetUser.id}\`)\n**السبب:** ${reason}\n**المشرف:** ${interaction.user.tag}`
      );
      await interaction.editReply({ embeds: [embed] });
    } else {
      const embed = createErrorEmbed('فشل فك الحظر', result.message);
      await interaction.editReply({ embeds: [embed] });
    }
  }
};
