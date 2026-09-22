import { Events } from 'discord.js';
import { LoggingService } from '../../services/loggingService.js';

export default {
  name: Events.GuildBanAdd,
  async execute(ban) {
    await LoggingService.logBan(ban);
  }
};
