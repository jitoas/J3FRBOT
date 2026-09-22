import { Events } from 'discord.js';
import { LoggingService } from '../../services/loggingService.js';

export default {
  name: Events.ChannelDelete,
  async execute(channel) {
    await LoggingService.logChannelDelete(channel);
  }
};
