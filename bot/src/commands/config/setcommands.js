import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { getDatabase } from '../../database/index.js';
import { createSuccessEmbed, createErrorEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setcommands')
    .setDescription('تعيين قناة مخصصة لأوامر البوت والستاف (Bot / Staff Commands Channel)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false)
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('قناة أوامر البوت المخصصة')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const channel = interaction.options.getChannel('channel');
    const db = getDatabase();

    const updated = await db.setGuildConfig(interaction.guildId, {
      commandsChannelId: channel.id
    });

    const embed = createSuccessEmbed(
      'تم تعيين قناة أوامر البوت بنجاح',
      `**القناة المحددة:** ${channel}\n\n🔒 **ملاحظة الأمان:** سيتم حصر تنفيذ جميع أوامر الإدارة مثل (\`/kick\`, \`/ban\`, \`/unban\`, \`/timeout\`, \`ti\`) في هذه القناة فقط، ولن يسمح بتنفيذها في أي قناة أخرى.`
    );

    await interaction.editReply({ embeds: [embed] });
  }
};
