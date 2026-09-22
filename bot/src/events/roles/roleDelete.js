import { Events } from 'discord.js';
import { LoggingService } from '../../services/loggingService.js';

export default {
  name: Events.RoleDelete,
  async execute(role) {
    await LoggingService.logRoleDelete(role);
  }
};
