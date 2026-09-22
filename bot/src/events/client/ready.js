import { Events, ActivityType } from 'discord.js';
import { logger } from '../../utils/logger.js';

export default {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    logger.bot(`✅ Logged in successfully as ${client.user.tag} (ID: ${client.user.id})`);
    logger.bot(`🌐 Active on ${client.guilds.cache.size} server(s) serving ${client.users.cache.size} user(s).`);

    // Set dynamic rich activity status
    client.user.setPresence({
      activities: [{
        name: `/help | ${client.guilds.cache.size} Servers`,
        type: ActivityType.Watching
      }],
      status: 'online'
    });
  }
};
