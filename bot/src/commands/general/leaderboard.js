import { SlashCommandBuilder } from 'discord.js';
import { getDatabase } from '../../database/index.js';
import { createBaseEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('عرض قائمة المتصدرين لأعلى الأعضاء نشاطاً ونقاط خبرة في السيرفر'),

  async execute(interaction) {
    await interaction.deferReply();
    const guildId = interaction.guildId;

    const db = getDatabase();
    const leaders = await db.getLeaderboard(guildId, 10);

    if (!leaders || leaders.length === 0) {
      const emptyEmbed = createBaseEmbed({
        title: '🏆 قائمة المتصدرين (Leaderboard)',
        description: 'لا توجد بيانات تفاعل مسجلة حتى الآن. أرسل بعض الرسائل لبدء كسب نقاط الخبرة (XP)!'
      });
      return interaction.editReply({ embeds: [emptyEmbed] });
    }

    const medals = ['🥇', '🥈', '🥉'];
    const leaderList = leaders.map((entry, index) => {
      const rankBadge = index < 3 ? medals[index] : `**#${index + 1}**`;
      const name = entry.username || `<@${entry.userId}>`;
      return `${rankBadge} ${name} — **Level ${entry.level}** (\`${entry.xp} XP\`)`;
    }).join('\n');

    const embed = createBaseEmbed({
      title: `🏆 قائمة المتصدرين في ${interaction.guild.name}`,
      description: leaderList
    });

    await interaction.editReply({ embeds: [embed] });
  }
};
