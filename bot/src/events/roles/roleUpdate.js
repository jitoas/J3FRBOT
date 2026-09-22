import { Events } from 'discord.js';
import { LoggingService } from '../../services/loggingService.js';

export default {
  name: Events.RoleUpdate,
  async execute(oldRole, newRole) {
    await LoggingService.logRoleUpdate(oldRole, newRole);
  }
};
