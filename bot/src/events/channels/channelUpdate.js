import { Events } from 'discord.js';
import { LoggingService } from '../../services/loggingService.js';

export default {
  name: Events.ChannelUpdate,
  async execute(oldChannel, newChannel) {
    await LoggingService.logChannelUpdate(oldChannel, newChannel);
  }
};
