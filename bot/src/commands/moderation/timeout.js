import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { ModerationService } from '../../services/moderationService.js';
import { createSuccessEmbed, createErrorEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('عزل عضو مؤقتًا (Timeout / Mute) ومنعه من الكتابة والتفاعل')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false)
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('العضو المستهدف بالعزل')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('duration')
        .setDescription('مدة العزل (مثال: 10s, 5m, 1h, 1d - الحد الأقصى 28 يوم)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('سبب العزل المؤقت')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: false });

    const targetUser = interaction.options.getUser('user');
    const duration = interaction.options.getString('duration');
    const reason = interaction.options.getString('reason') || 'لم يتم تحديد سبب';

    const result = await ModerationService.timeoutMember(interaction, targetUser, duration, reason);

    if (!result.success) {
      const errorEmbed = createErrorEmbed('فشل تنفيذ العزل المؤقت', result.message);
      return interaction.editReply({ embeds: [errorEmbed] });
    }

    const successEmbed = createSuccessEmbed(
      'تم العزل المؤقت بنجاح',
      `**العضو:** ${targetUser} (\`${targetUser.tag}\`)\n**المدة:** \`${result.durationLabel}\`\n**السبب:** ${reason}\n**المشرف:** ${interaction.user}`
    );

    await interaction.editReply({ embeds: [successEmbed] });
  }
};
