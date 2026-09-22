import { Client, Collection } from 'discord.js';
import dotenv from 'dotenv';
import { botConfig } from './config/botConfig.js';
import { botIntents, botPartials } from './config/intents.js';
import { initDatabase, closeDatabase } from './database/index.js';
import { startWebServer } from './server.js';
import { logger } from './utils/logger.js';

// Import Commands
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

// Import Events
import readyEvent from './events/client/ready.js';
import interactionCreateEvent from './events/client/interactionCreate.js';
import guildMemberAddEvent from './events/guild/guildMemberAdd.js';
import guildMemberRemoveEvent from './events/guild/guildMemberRemove.js';
import guildBanAddEvent from './events/guild/guildBanAdd.js';
import guildBanRemoveEvent from './events/guild/guildBanRemove.js';
import guildCreateEvent from './events/guild/guildCreate.js';
import guildUpdateEvent from './events/guild/guildUpdate.js';
import messageDeleteEvent from './events/messages/messageDelete.js';
import messageUpdateEvent from './events/messages/messageUpdate.js';
import messageCreateEvent from './events/messages/messageCreate.js';
import channelCreateEvent from './events/channels/channelCreate.js';
import channelDeleteEvent from './events/channels/channelDelete.js';
import channelUpdateEvent from './events/channels/channelUpdate.js';
import roleCreateEvent from './events/roles/roleCreate.js';
import roleDeleteEvent from './events/roles/roleDelete.js';
import roleUpdateEvent from './events/roles/roleUpdate.js';
import voiceStateUpdateEvent from './events/voice/voiceStateUpdate.js';

dotenv.config();

// ==============================================================================
// 1. GLOBAL ERROR HANDLING & PROCESS RESILIENCE
// ==============================================================================
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection caught globally:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception caught globally:', error);
});

process.on('uncaughtExceptionMonitor', (error, origin) => {
  logger.error(`Uncaught Exception Monitor (${origin}):`, error);
});

// ==============================================================================
// 2. INITIALIZE DISCORD CLIENT
// ==============================================================================
const client = new Client({
  intents: botIntents,
  partials: botPartials
});

client.commands = new Collection();

// Register Commands in Memory
const commandsList = [
  kickCommand,
  banCommand,
  unbanCommand,
  timeoutCommand,
  setWelcomeCommand,
  setLogsCommand,
  setCommandsCommand,
  configCommand,
  pingCommand,
  helpCommand
];

for (const command of commandsList) {
  if (command?.data?.name) {
    client.commands.set(command.data.name, command);
    logger.debug(`Loaded Slash Command: /${command.data.name}`);
  }
}

// Register Events with Safe Wrapper (Prevents one event error from crashing the bot)
const eventsList = [
  readyEvent,
  interactionCreateEvent,
  guildMemberAddEvent,
  guildMemberRemoveEvent,
  guildBanAddEvent,
  guildBanRemoveEvent,
  guildCreateEvent,
  guildUpdateEvent,
  messageDeleteEvent,
  messageUpdateEvent,
  messageCreateEvent,
  channelCreateEvent,
  channelDeleteEvent,
  channelUpdateEvent,
  roleCreateEvent,
  roleDeleteEvent,
  roleUpdateEvent,
  voiceStateUpdateEvent
];

for (const event of eventsList) {
  const handler = async (...args) => {
    try {
      await event.execute(...args, client);
    } catch (err) {
      logger.error(`Error in event listener '${event.name}':`, err);
    }
  };

  if (event.once) {
    client.once(event.name, handler);
  } else {
    client.on(event.name, handler);
  }
}

// ==============================================================================
// 3. BOOTSTRAP & STARTUP SEQUENCE
// ==============================================================================
async function bootstrap() {
  logger.info('🚀 Starting Discord Bot Master initialization...');

  // Connect Database
  try {
    await initDatabase();
  } catch (dbErr) {
    logger.error('Database connection failed:', dbErr.message);
  }

  // Start Web Keep-Alive Server for Render
  const server = startWebServer(client);

  // Validate Token and Login
  const token = botConfig.token;
  if (!token) {
    logger.warn('⚠️ DISCORD_TOKEN is not set! Set DISCORD_TOKEN in your .env or Render dashboard to connect to Discord.');
    return;
  }

  try {
    await client.login(token);
  } catch (loginErr) {
    logger.error('❌ Failed to login to Discord:', loginErr.message);
  }

  // Graceful Shutdown
  const shutdown = async (signal) => {
    logger.info(`Received ${signal}. Initiating graceful shutdown...`);
    
    try {
      if (server) server.close();
      await closeDatabase();
      client.destroy();
      logger.info('Client destroyed, database closed. Exiting process.');
    } catch (shutdownErr) {
      logger.error('Error during shutdown:', shutdownErr);
    } finally {
      process.exit(0);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap();
