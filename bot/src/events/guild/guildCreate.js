import { Events } from 'discord.js';
import { LoggingService } from '../../services/loggingService.js';
import { logger } from '../../utils/logger.js';

export default {
  name: Events.GuildCreate,
  async execute(guild) {
    logger.bot(`Joined a new guild: ${guild.name} (ID: ${guild.id}) with ${guild.memberCount} members.`);
    await LoggingService.logBotJoin(guild);
  }
};
