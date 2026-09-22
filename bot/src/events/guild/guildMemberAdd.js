import { Events, AttachmentBuilder, PermissionsBitField } from 'discord.js';
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
      logger.info(`[WELCOME] Member joined: ${user.tag || user.username} (ID: ${user.id}, Bot: ${user.bot}) in '${guild.name}' (${guild.id})`);

      const db = getDatabase();
      const config = await db.getGuildConfig(guild.id);

      logger.info(`[WELCOME] Config loaded: enabled=${config?.welcomeEnabled}, channelId=${config?.welcomeChannelId}`);

      if (!config.welcomeEnabled) {
        logger.info(`[WELCOME] Welcome system is disabled (welcomeEnabled = false) for guild '${guild.name}' (${guild.id})`);
        return;
      }

      if (!config.welcomeChannelId) {
        logger.warn(`[WELCOME ERROR] Welcome system enabled but welcomeChannelId is not configured for guild '${guild.name}' (${guild.id})`);
        return;
      }

      const targetChannel = String(config.welcomeChannelId).trim();
      let welcomeChannel = null;

      if (/^\d+$/.test(targetChannel)) {
        welcomeChannel = guild.channels.cache.get(targetChannel) || 
                         await guild.channels.fetch(targetChannel).catch(() => null);
      } else {
        welcomeChannel = guild.channels.cache.find(
          c => c.id === targetChannel || c.name === targetChannel || c.name.toLowerCase() === targetChannel.toLowerCase()
        );
      }

      if (!welcomeChannel || !welcomeChannel.isTextBased()) {
        logger.error(`[WELCOME ERROR] Configured welcome channel '${targetChannel}' not found or not text-based in guild '${guild.name}' (${guild.id})`);
        return;
      }

      logger.info(`[WELCOME] Channel found: #${welcomeChannel.name} (ID: ${welcomeChannel.id})`);

      // Permissions Check
      const me = guild.members.me || (await guild.members.fetchMe().catch(() => null));
      if (me && welcomeChannel.permissionsFor) {
        const perms = welcomeChannel.permissionsFor(me);
        if (perms) {
          const missing = [];
          if (!perms.has(PermissionsBitField.Flags.ViewChannel)) missing.push('ViewChannel');
          if (!perms.has(PermissionsBitField.Flags.SendMessages)) missing.push('SendMessages');
          if (!perms.has(PermissionsBitField.Flags.AttachFiles)) missing.push('AttachFiles');

          if (missing.length > 0) {
            logger.warn(`[WELCOME ERROR] Missing permissions in welcome channel #${welcomeChannel.name}: ${missing.join(', ')}`);
          } else {
            logger.info(`[WELCOME] Permissions checked: ViewChannel, SendMessages, AttachFiles ok`);
          }
        }
      }

      // Format custom welcome message
      const formattedMessage = (config.welcomeMessage || 'Welcome {user} to {server}!')
        .replace(/{user}/g, `<@${user.id}>`)
        .replace(/{username}/g, user.username)
        .replace(/{server}/g, guild.name)
        .replace(/{count}/g, guild.memberCount.toString());

      // Prepare avatar URL with safe fallbacks for both regular users and bot accounts
      let avatarUrl = user.displayAvatarURL({ extension: 'png', size: 256, forceStatic: true });
      if (!avatarUrl) {
        avatarUrl = user.defaultAvatarURL;
      }

      const bgPath = config.welcomeBackgroundPath || './assets/welcome-bg.png';
      logger.info(`[WELCOME] Background path: ${bgPath}`);
      logger.info(`[WELCOME] Avatar URL: ${avatarUrl}`);

      // Generate custom Canvas Welcome Card
      const cardBuffer = await WelcomeCardService.generateCard({
        username: user.username,
        avatarUrl,
        serverName: guild.name,
        memberCount: guild.memberCount,
        backgroundPath: bgPath,
        cardConfig: config.welcomeCardConfig || {
          avatar: { enabled: true, x: 140, y: 180, size: 120 },
          username: { enabled: true, x: 240, y: 180, fontSize: 34, color: '#ffffff' },
          welcomeText: { enabled: true, text: config.welcomeCustomText || 'WELCOME', x: 240, y: 120, fontSize: 22, color: '#38bdf8' },
          memberCount: { enabled: false, format: 'Member #{count}', x: 240, y: 225, fontSize: 16, color: '#cbd5e1' }
        }
      });

      logger.info(`[WELCOME] Canvas generated: ${cardBuffer?.length || 0} bytes`);

      const attachment = new AttachmentBuilder(cardBuffer, { name: `welcome-${user.id}.png` });

      logger.info(`[WELCOME] Sending welcome card to #${welcomeChannel.name}...`);

      await welcomeChannel.send({
        content: formattedMessage,
        files: [attachment]
      });

      logger.info(`[WELCOME] Welcome card sent successfully to #${welcomeChannel.name} for ${user.tag || user.username}`);
    } catch (error) {
      logger.error(`[WELCOME ERROR] Failed delivering welcome card in guild ${guild.id}: ${error.message}`, error);
    }
  }
};

