import { Events } from 'discord.js';
import { LoggingService } from '../../services/loggingService.js';

export default {
  name: Events.RoleCreate,
  async execute(role) {
    await LoggingService.logRoleCreate(role);
  }
};
