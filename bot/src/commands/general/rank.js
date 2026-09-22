import { SlashCommandBuilder } from 'discord.js';
import { getDatabase } from '../../database/index.js';
import { LevelService } from '../../services/levelService.js';
import { createBaseEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('عرض مستواك الحالي ونقاط الخبرة (XP) ومقدار التقدم نحو المستوى القادم')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('العضو المراد فحص رتبته ومستواه (اختياري)')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply();
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const guildId = interaction.guildId;

    const db = getDatabase();
    const userStats = await db.getUserLevel(guildId, targetUser.id);
    const thresholds = await db.getLevelThresholds(guildId);

    const currentLevel = LevelService.calculateLevel(userStats.xp || 0, thresholds);
    const nextInfo = LevelService.getNextLevelDetails(userStats.xp || 0, currentLevel, thresholds);

    // Build progress bar
    const filledBlocks = Math.round((nextInfo.progressPercent / 100) * 10);
    const emptyBlocks = 10 - filledBlocks;
    const progressBar = '▰'.repeat(filledBlocks) + '▱'.repeat(emptyBlocks);

    const embed = createBaseEmbed({
      title: `📊 بطاقة مستوى: ${targetUser.username}`,
      thumbnail: { url: targetUser.displayAvatarURL({ dynamic: true }) },
      fields: [
        { name: '🎖️ المستوى الحالي (Level)', value: `**Level ${currentLevel}**`, inline: true },
        { name: '✨ إجمالي نقاط الخبرة (XP)', value: `\`${userStats.xp || 0} XP\``, inline: true },
        { 
          name: nextInfo.nextLevel ? `🎯 التقدم نحو Level ${nextInfo.nextLevel}` : '🏆 الحد الأقصى للمستويات', 
          value: nextInfo.nextLevel 
            ? `${progressBar} **${nextInfo.progressPercent}%**\nالمتبقي: \`${nextInfo.neededXp} XP\` للوصول إلى Level ${nextInfo.nextLevel}`
            : 'لقد بلغت أعلى مستوى متوفر في هذا السيرفر!', 
          inline: false 
        }
      ]
    });

    await interaction.editReply({ embeds: [embed] });
  }
};
