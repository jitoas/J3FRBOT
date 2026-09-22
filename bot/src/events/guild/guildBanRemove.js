import { Events } from 'discord.js';
import { LoggingService } from '../../services/loggingService.js';

export default {
  name: Events.GuildBanRemove,
  async execute(ban) {
    await LoggingService.logUnban(ban);
  }
};
