import { Events } from 'discord.js';
import { LoggingService } from '../../services/loggingService.js';

export default {
  name: Events.GuildUpdate,
  async execute(oldGuild, newGuild) {
    await LoggingService.logGuildUpdate(oldGuild, newGuild);
  }
};
