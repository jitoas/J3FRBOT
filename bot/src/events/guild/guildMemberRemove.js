import { Events } from 'discord.js';
import { LoggingService } from '../../services/loggingService.js';

export default {
  name: Events.GuildMemberRemove,
  async execute(member) {
    await LoggingService.logMemberLeaveOrKick(member);
  }
};
