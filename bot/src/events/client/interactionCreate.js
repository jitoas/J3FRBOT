import { Events } from 'discord.js';
import { logger } from '../../utils/logger.js';
import { createErrorEmbed } from '../../utils/embedBuilder.js';
import { checkCommandsChannel } from '../../utils/permissions.js';

const STAFF_COMMANDS = new Set(['kick', 'ban', 'unban', 'timeout']);

export default {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
      logger.warn(`Command matching ${interaction.commandName} was not found on interaction trigger.`);
      return;
    }

    // Check channel restriction for staff / moderation commands
    if (interaction.guildId && STAFF_COMMANDS.has(interaction.commandName)) {
      const channelCheck = await checkCommandsChannel(
        interaction.guildId, 
        interaction.channelId, 
        interaction.channel?.name, 
        interaction.guild
      );
      if (!channelCheck.allowed) {
        const channelErrorEmbed = createErrorEmbed(
          'قناة غير مخصصة للأوامر',
          channelCheck.reason || `أوامر الإدارة والبوت مسموحة فقط في قناة <#${channelCheck.commandsChannelId}>.`
        );
        return interaction.reply({ embeds: [channelErrorEmbed], ephemeral: true });
      }
    }

    try {
      logger.info(`Executing command /${interaction.commandName} by ${interaction.user.tag} in ${interaction.guild?.name || 'DM'}`);
      await command.execute(interaction, client);
    } catch (error) {
      logger.error(`Error executing command /${interaction.commandName}: ${error.stack || error.message}`);
      
      const errorEmbed = createErrorEmbed(
        'خطأ في معالجة الأمر',
        'حدث خطأ داخلي أثناء تنفيذ هذا الأمر. تم تسجيل تفاصيل الخطأ للمراجعة.'
      );

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [errorEmbed], ephemeral: true }).catch(() => {});
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true }).catch(() => {});
      }
    }
  }
};
