import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import { logger } from './utils/logger.js';

// Import all commands
import kickCommand from './commands/moderation/kick.js';
import banCommand from './commands/moderation/ban.js';
import unbanCommand from './commands/moderation/unban.js';
import timeoutCommand from './commands/moderation/timeout.js';
import setWelcomeCommand from './commands/config/setwelcome.js';
import setLogsCommand from './commands/config/setlogs.js';
import setCommandsCommand from './commands/config/setcommands.js';
import configCommand from './commands/config/config.js';
import pingCommand from './commands/general/ping.js';
import helpCommand from './commands/general/help.js';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const devGuildId = process.env.DEV_GUILD_ID;

if (!token || !clientId) {
  logger.error('Missing DISCORD_TOKEN or CLIENT_ID in environment variables.');
  process.exit(1);
}

const commands = [
  kickCommand.data.toJSON(),
  banCommand.data.toJSON(),
  unbanCommand.data.toJSON(),
  timeoutCommand.data.toJSON(),
  setWelcomeCommand.data.toJSON(),
  setLogsCommand.data.toJSON(),
  setCommandsCommand.data.toJSON(),
  configCommand.data.toJSON(),
  pingCommand.data.toJSON(),
  helpCommand.data.toJSON()
];

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    logger.info(`Started refreshing ${commands.length} application (/) commands.`);

    if (devGuildId) {
      // Instant registration for development server
      logger.info(`Deploying commands locally to Development Guild ID: ${devGuildId}`);
      const data = await rest.put(
        Routes.applicationGuildCommands(clientId, devGuildId),
        { body: commands }
      );
      logger.info(`Successfully reloaded ${data.length} guild (/) commands instantly!`);
    } else {
      // Global registration (standard for production)
      logger.info('Deploying commands globally across all Discord servers...');
      const data = await rest.put(
        Routes.applicationCommands(clientId),
        { body: commands }
      );
      logger.info(`Successfully reloaded ${data.length} global (/) commands!`);
    }
  } catch (error) {
    logger.error(`Failed to deploy commands: ${error.stack || error.message}`);
    process.exit(1);
  }
})();
