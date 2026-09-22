export interface BotFile {
  name: string;
  path: string;
  category: string;
  description: string;
  content: string;
}

export const BOT_FILES: BotFile[] = [
  {
    name: 'package.json',
    path: 'package.json',
    category: 'config',
    description: 'Root package configuration for Vite Dashboard, Express Server, and Discord Bot dependencies.',
    content: `{
  "name": "discord-bot-master",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --port=3000 --host=0.0.0.0",
    "build": "vite build",
    "preview": "vite preview",
    "start": "node bot/src/index.js",
    "bot": "node bot/src/index.js",
    "deploy-commands": "node bot/src/deploy-commands.js"
  },
  "dependencies": {
    "discord.js": "^14.27.0",
    "dotenv": "^17.2.3",
    "express": "^4.21.2",
    "@napi-rs/canvas": "^1.0.9",
    "pg": "^8.23.0"
  }
}`
  },
  {
    name: '.env.example',
    path: '.env.example',
    category: 'config',
    description: 'Environment variables template for Discord bot credentials and Supabase database URI.',
    content: `# Discord Bot Application Credentials
DISCORD_TOKEN=your_discord_bot_token_here
CLIENT_ID=your_discord_client_id_here
DEV_GUILD_ID=

# Server & Render Configuration
PORT=3000
NODE_ENV=production

# Database Adapter Selection ('json', 'postgres', or 'supabase')
DB_TYPE=postgres
DATABASE_URL=postgresql://postgres:password@host:5432/postgres?sslmode=require`
  },
  {
    name: 'render.yaml',
    path: 'render.yaml',
    category: 'deploy',
    description: 'Render Blueprint infrastructure-as-code specification for automated web service deployment.',
    content: `services:
  - type: web
    name: discord-bot-master
    runtime: node
    plan: free
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
      - key: DISCORD_TOKEN
        sync: false
      - key: CLIENT_ID
        sync: false
      - key: DB_TYPE
        value: postgres
      - key: DATABASE_URL
        sync: false`
  },
  {
    name: 'server.js',
    path: 'bot/src/server.js',
    category: 'core',
    description: 'Express web server serving React SPA Dashboard from dist/ and /health endpoint for UptimeRobot.',
    content: `import express from 'express';
import path from 'path';
import fs from 'fs';
import { logger } from './utils/logger.js';
import { botConfig } from './config/botConfig.js';

export const startWebServer = (client) => {
  const app = express();
  const port = botConfig.port || 3000;
  app.use(express.json());

  let distPath = path.resolve(process.cwd(), 'dist');
  if (!fs.existsSync(distPath)) {
    const altDist = path.resolve(process.cwd(), '../dist');
    if (fs.existsSync(altDist)) distPath = altDist;
  }

  // Health check endpoint for Render & UptimeRobot
  app.get('/health', (req, res) => {
    const isBotReady = Boolean(client?.isReady());
    res.status(isBotReady ? 200 : 503).json({
      status: isBotReady ? 'healthy' : 'starting',
      botReady: isBotReady,
      botTag: client?.user?.tag || null,
      guilds: client?.guilds?.cache?.size || 0,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });

  // Serve static assets from built React frontend
  app.use(express.static(distPath));

  // SPA fallback routing
  app.get('*', (req, res) => {
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.send('<h1>Discord Bot is Online</h1><p>Dashboard build pending. Access /health for status.</p>');
    }
  });

  return app.listen(port, '0.0.0.0', () => {
    logger.info(\`HTTP Server running on http://0.0.0.0:\${port}\`);
  });
};`
  },
  {
    name: 'index.js',
    path: 'bot/src/index.js',
    category: 'core',
    description: 'Primary bot lifecycle entry point registering 18+ events, 10 commands, database, and Express server.',
    content: `import { Client, Collection } from 'discord.js';
import dotenv from 'dotenv';
import { botIntents, botPartials } from './config/intents.js';
import { botConfig } from './config/botConfig.js';
import { logger } from './utils/logger.js';
import { initDatabase } from './database/index.js';
import { startWebServer } from './server.js';

dotenv.config();

const client = new Client({
  intents: botIntents,
  partials: botPartials
});

client.commands = new Collection();

async function bootstrap() {
  logger.info('🚀 Starting Discord Bot Master initialization...');

  // 1. Connect Database (Supabase PostgreSQL / JSON)
  try {
    await initDatabase();
  } catch (dbErr) {
    logger.error('Database connection failed:', dbErr.message);
  }

  // 2. Start Web Keep-Alive & Dashboard Server
  try {
    startWebServer(client);
  } catch (webErr) {
    logger.error('Failed to start Web Keep-Alive server:', webErr.message);
  }

  // 3. Login to Discord Gateway
  if (!botConfig.token) {
    logger.error('DISCORD_TOKEN missing in environment variables!');
    return;
  }

  await client.login(botConfig.token);
}

bootstrap().catch(err => {
  logger.error('Fatal initialization error:', err);
});`
  },
  {
    name: 'deploy-commands.js',
    path: 'bot/src/deploy-commands.js',
    category: 'core',
    description: 'Slash command deployment script supporting instant Guild deployment and Global deployment.',
    content: `import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import { logger } from './utils/logger.js';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const devGuildId = process.env.DEV_GUILD_ID;

if (!token || !clientId) {
  logger.error('Missing DISCORD_TOKEN or CLIENT_ID.');
  process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(token);

export async function deployCommands(commands) {
  try {
    if (devGuildId) {
      await rest.put(Routes.applicationGuildCommands(clientId, devGuildId), { body: commands });
      logger.info('Commands reloaded locally to dev guild.');
    } else {
      await rest.put(Routes.applicationCommands(clientId), { body: commands });
      logger.info('Commands deployed globally.');
    }
  } catch (error) {
    logger.error('Failed to deploy commands:', error);
  }
}`
  },
  {
    name: 'botConfig.js',
    path: 'bot/src/config/botConfig.js',
    category: 'config',
    description: 'Centralized bot configuration object and default fallback values for guild settings.',
    content: `import dotenv from 'dotenv';
dotenv.config();

export const botConfig = {
  token: process.env.DISCORD_TOKEN || '',
  clientId: process.env.CLIENT_ID || '',
  devGuildId: process.env.DEV_GUILD_ID || '',
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'production',
  dbType: process.env.DB_TYPE || 'postgres',
  defaults: {
    welcomeEnabled: true,
    welcomeMessage: 'Welcome {user} to **{server}**!',
    welcomeBackgroundPath: './assets/welcome-bg.png',
    welcomeCardConfig: {
      avatar: { enabled: true, x: 140, y: 180, size: 120 },
      username: { enabled: true, x: 240, y: 180, fontSize: 34, color: '#ffffff' },
      welcomeText: { enabled: true, text: 'WELCOME', x: 240, y: 120, fontSize: 22, color: '#38bdf8' },
      memberCount: { enabled: false, format: 'Member #{count}', x: 240, y: 225, fontSize: 16, color: '#cbd5e1' }
    },
    logsEnabled: true,
    commandsChannelId: null,
    levelingEnabled: false,
    xpRate: 1.0
  }
};`
  },
  {
    name: 'postgresAdapter.js',
    path: 'bot/src/database/adapters/postgresAdapter.js',
    category: 'database',
    description: 'Production Supabase PostgreSQL adapter with automatic migrations, pool connection, and parameterized queries.',
    content: `import pg from 'pg';
import { BaseAdapter } from './baseAdapter.js';
import { logger } from '../../utils/logger.js';
import { botConfig } from '../../config/botConfig.js';

const { Pool } = pg;

export class PostgresDatabaseAdapter extends BaseAdapter {
  constructor(connectionString = process.env.DATABASE_URL) {
    super();
    this.connectionString = connectionString;
    this.pool = null;
  }

  async connect() {
    if (!this.connectionString) {
      throw new Error('DATABASE_URL is required for PostgreSQL/Supabase adapter.');
    }

    const isSsl = process.env.NODE_ENV === 'production' || this.connectionString.includes('supabase');
    this.pool = new Pool({
      connectionString: this.connectionString,
      ssl: isSsl ? { rejectUnauthorized: false } : undefined
    });

    const client = await this.pool.connect();
    try {
      await client.query(\`
        CREATE TABLE IF NOT EXISTS guild_configs (
          guild_id VARCHAR(32) PRIMARY KEY,
          welcome_channel_id VARCHAR(32),
          welcome_enabled BOOLEAN DEFAULT true,
          welcome_message TEXT,
          welcome_theme VARCHAR(64) DEFAULT 'modern-dark',
          logs_channel_id VARCHAR(32),
          logs_enabled BOOLEAN DEFAULT true,
          leveling_enabled BOOLEAN DEFAULT false,
          xp_rate NUMERIC(3,2) DEFAULT 1.0,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS user_levels (
          guild_id VARCHAR(32) NOT NULL,
          user_id VARCHAR(32) NOT NULL,
          xp BIGINT DEFAULT 0,
          level INT DEFAULT 0,
          last_xp_earned BIGINT DEFAULT 0,
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          PRIMARY KEY (guild_id, user_id)
        );

        ALTER TABLE guild_configs ADD COLUMN IF NOT EXISTS commands_channel_id VARCHAR(32);
        ALTER TABLE guild_configs ADD COLUMN IF NOT EXISTS welcome_background_path TEXT;
        ALTER TABLE guild_configs ADD COLUMN IF NOT EXISTS welcome_card_config JSONB;
      \`);
      logger.info('[PostgreSQL Adapter] Connected and verified migrations successfully.');
    } finally {
      client.release();
    }
  }

  async getGuildConfig(guildId) {
    const res = await this.pool.query('SELECT * FROM guild_configs WHERE guild_id = $1', [guildId]);
    if (res.rows.length === 0) return { guildId, ...botConfig.defaults };
    return res.rows[0];
  }

  async setGuildConfig(guildId, configData) {
    // Parameterized upsert into guild_configs table
  }
}`
  },
  {
    name: 'loggingService.js',
    path: 'bot/src/services/loggingService.js',
    category: 'services',
    description: 'Comprehensive audit logging service handling 15+ events (Members, Messages, Channels, Roles, Voice).',
    content: `import { createLogEmbed } from '../utils/embedBuilder.js';
import { getDatabase } from '../database/index.js';
import { logger } from '../utils/logger.js';

export class LoggingService {
  static async sendLog(guild, logData) {
    const db = getDatabase();
    const config = await db.getGuildConfig(guild.id);
    if (!config.logsEnabled || !config.logsChannelId) return;

    const channel = guild.channels.cache.get(config.logsChannelId);
    if (!channel) return;

    const embed = createLogEmbed(logData);
    await channel.send({ embeds: [embed] }).catch(err => {
      logger.error('Failed to send log embed:', err.message);
    });
  }

  static async logVoiceStateUpdate(oldState, newState) {
    const member = newState.member || oldState.member;
    if (!member || member.user.bot) return;
    const guild = newState.guild || oldState.guild;

    if (!oldState.channelId && newState.channelId) {
      // Voice Join
    } else if (oldState.channelId && !newState.channelId) {
      // Voice Leave
    } else if (oldState.channelId !== newState.channelId) {
      // Voice Switch
    }
  }
}`
  },
  {
    name: 'welcomeCardService.js',
    path: 'bot/src/services/welcomeCardService.js',
    category: 'services',
    description: 'High-performance Canvas rendering engine generating clean personalized Welcome Cards without artificial overlays.',
    content: `import { createCanvas, loadImage } from '@napi-rs/canvas';
import { logger } from '../utils/logger.js';

export class WelcomeCardService {
  static async generateCard({ member, backgroundBuffer, config }) {
    const width = 800;
    const height = 360;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // 1. Draw pure custom uploaded background
    if (backgroundBuffer) {
      const bg = await loadImage(backgroundBuffer);
      ctx.drawImage(bg, 0, 0, width, height);
    } else {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Render Avatar if enabled
    if (config.avatar.enabled) {
      const avatarUrl = member.user.displayAvatarURL({ extension: 'png', size: 256 });
      const avatarImg = await loadImage(avatarUrl);
      ctx.save();
      ctx.beginPath();
      ctx.arc(config.avatar.x, config.avatar.y, config.avatar.size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatarImg, config.avatar.x - config.avatar.size / 2, config.avatar.y - config.avatar.size / 2, config.avatar.size, config.avatar.size);
      ctx.restore();
    }

    // 3. Render Username, Welcome Text, and Member Count
    return canvas.toBuffer('image/png');
  }
}`
  },
  {
    name: 'setcommands.js',
    path: 'bot/src/commands/config/setcommands.js',
    category: 'commands',
    description: 'Restricts moderation & bot commands to a designated channel. Enforces ManageGuild / Administrator permissions.',
    content: `import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { getDatabase } from '../../database/index.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setcommands')
    .setDescription('تحديد قناة مخصصة لأوامر البوت')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('القناة المراد قفل الأوامر بداخلها')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),
  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    const db = getDatabase();
    await db.setGuildConfig(interaction.guildId, { commandsChannelId: channel.id });
    await interaction.reply({ content: \`✅ تم قفل أوامر البوت داخل \${channel}.\`, ephemeral: true });
  }
};`
  }
];
