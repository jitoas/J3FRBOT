import { Events } from 'discord.js';
import { LoggingService } from '../../services/loggingService.js';

export default {
  name: Events.MessageUpdate,
  async execute(oldMessage, newMessage) {
    await LoggingService.logMessageUpdate(oldMessage, newMessage);
  }
};
