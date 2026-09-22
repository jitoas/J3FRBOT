import { Events } from 'discord.js';
import { LoggingService } from '../../services/loggingService.js';

export default {
  name: Events.ChannelCreate,
  async execute(channel) {
    await LoggingService.logChannelCreate(channel);
  }
};
