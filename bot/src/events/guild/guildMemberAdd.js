import { Events, AttachmentBuilder } from 'discord.js';
import { getDatabase } from '../../database/index.js';
import { WelcomeCardService } from '../../services/welcomeCardService.js';
import { LoggingService } from '../../services/loggingService.js';
import { logger } from '../../utils/logger.js';

export default {
  name: Events.GuildMemberAdd,
  async execute(member) {
    const { guild, user } = member;

    // 1. Trigger Logging System
    await LoggingService.logMemberJoin(member);

    // 2. Trigger Welcome System
    try {
      const db = getDatabase();
      const config = await db.getGuildConfig(guild.id);

      if (!config.welcomeEnabled || !config.welcomeChannelId) {
        return;
      }

      const welcomeChannel = guild.channels.cache.get(config.welcomeChannelId) || 
                             await guild.channels.fetch(config.welcomeChannelId).catch(() => null);

      if (!welcomeChannel || !welcomeChannel.isTextBased()) {
        logger.warn(`Configured welcome channel ${config.welcomeChannelId} not found or not text-based in ${guild.id}`);
        return;
      }

      // Format custom welcome message
      const formattedMessage = (config.welcomeMessage || 'Welcome {user} to {server}!')
        .replace(/{user}/g, `<@${user.id}>`)
        .replace(/{username}/g, user.username)
        .replace(/{server}/g, guild.name)
        .replace(/{count}/g, guild.memberCount.toString());

      // Generate custom Canvas Welcome Card
      const avatarUrl = user.displayAvatarURL({ extension: 'png', size: 256, forceStatic: true });
      const cardBuffer = await WelcomeCardService.generateCard({
        username: user.username,
        avatarUrl,
        serverName: guild.name,
        memberCount: guild.memberCount,
        backgroundPath: config.welcomeBackgroundPath || './assets/welcome-bg.png',
        cardConfig: config.welcomeCardConfig || {
          avatar: { enabled: true, x: 140, y: 180, size: 120 },
          username: { enabled: true, x: 240, y: 180, fontSize: 34, color: '#ffffff' },
          welcomeText: { enabled: true, text: config.welcomeCustomText || 'WELCOME', x: 240, y: 120, fontSize: 22, color: '#38bdf8' },
          memberCount: { enabled: false, format: 'Member #{count}', x: 240, y: 225, fontSize: 16, color: '#cbd5e1' }
        }
      });

      const attachment = new AttachmentBuilder(cardBuffer, { name: `welcome-${user.id}.png` });

      await welcomeChannel.send({
        content: formattedMessage,
        files: [attachment]
      });

      logger.info(`Sent welcome card for ${user.tag} in ${guild.name} (#${welcomeChannel.name})`);
    } catch (error) {
      logger.error(`Error delivering welcome card in guild ${guild.id}: ${error.message}`);
    }
  }
};
