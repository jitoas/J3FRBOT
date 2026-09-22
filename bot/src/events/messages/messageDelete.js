import { Events } from 'discord.js';
import { LoggingService } from '../../services/loggingService.js';

export default {
  name: Events.MessageDelete,
  async execute(message) {
    await LoggingService.logMessageDelete(message);
  }
};
