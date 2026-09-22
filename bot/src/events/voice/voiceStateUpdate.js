import { Events } from 'discord.js';
import { LoggingService } from '../../services/loggingService.js';

export default {
  name: Events.VoiceStateUpdate,
  async execute(oldState, newState) {
    await LoggingService.logVoiceStateUpdate(oldState, newState);
  }
};
