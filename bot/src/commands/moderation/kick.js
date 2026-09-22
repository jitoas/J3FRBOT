import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { ModerationService } from '../../services/moderationService.js';
import { createSuccessEmbed, createErrorEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('طرد عضو من السيرفر (Kick Member)')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .setDMPermission(false)
    .addUserOption(option =>
      option
        .setName('target')
        .setDescription('العضو المراد طرده')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('سبب الطرد')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const targetUser = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason') || 'لم يتم تحديد سبب';

    const result = await ModerationService.kickMember(interaction, targetUser, reason);

    if (result.success) {
      const embed = createSuccessEmbed(
        'تم طرد العضو بنجاح',
        `**العضو:** ${targetUser.tag} (\`${targetUser.id}\`)\n**السبب:** ${reason}\n**المشرف:** ${interaction.user.tag}`
      );
      await interaction.editReply({ embeds: [embed] });
    } else {
      const embed = createErrorEmbed('فشل طرد العضو', result.message);
      await interaction.editReply({ embeds: [embed] });
    }
  }
};
