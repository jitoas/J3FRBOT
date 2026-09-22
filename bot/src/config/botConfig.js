import dotenv from 'dotenv';
dotenv.config();

export const botConfig = {
  token: process.env.DISCORD_TOKEN || '',
  clientId: process.env.CLIENT_ID || '',
  devGuildId: process.env.DEV_GUILD_ID || '',
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'production',
  dbType: process.env.DB_TYPE || 'json',
  dbPath: process.env.DB_PATH || './data/database.json',
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // Default Guild Configuration fallback values
  defaults: {
    welcomeChannelId: process.env.WELCOME_CHANNEL_ID || null,
    welcomeEnabled: true,
    welcomeMessage: 'Welcome {user} to **{server}**! We are glad to have you here 🎉',
    welcomeCustomText: 'WELCOME TO THE SERVER',
    welcomeBackgroundPath: process.env.WELCOME_BG_PATH || './assets/welcome-bg.png',
    welcomeCardConfig: {
      avatar: { enabled: true, x: 140, y: 180, size: 120 },
      username: { enabled: true, x: 240, y: 180, fontSize: 34, color: '#ffffff' },
      welcomeText: { enabled: true, text: 'WELCOME', x: 240, y: 120, fontSize: 22, color: '#38bdf8' },
      memberCount: { enabled: false, format: 'Member #{count}', x: 240, y: 225, fontSize: 16, color: '#cbd5e1' }
    },
    logsChannelId: process.env.LOG_CHANNEL_ID || null,
    logsEnabled: true,
    commandsChannelId: process.env.COMMANDS_CHANNEL_ID || null,
    levelingEnabled: false,
    xpRate: 1.0,
    embedColor: 0x5865F2, // Discord Blurple
    successColor: 0x57F287, // Discord Green
    warningColor: 0xFEE75C, // Discord Yellow
    dangerColor: 0xED4245, // Discord Red
    infoColor: 0x5865F2 // Discord Blurple
  }
};
