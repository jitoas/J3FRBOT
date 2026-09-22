import { botConfig } from '../config/botConfig.js';
import { logger } from '../utils/logger.js';
import { JsonDatabaseAdapter } from './adapters/jsonAdapter.js';
import { SqliteDatabaseAdapter } from './adapters/sqliteAdapter.js';
import { PostgresDatabaseAdapter } from './adapters/postgresAdapter.js';

let adapterInstance = null;

export const getDatabase = () => {
  if (adapterInstance) {
    return adapterInstance;
  }

  const dbType = botConfig.dbType.toLowerCase();

  switch (dbType) {
    case 'sqlite':
      logger.info('Initializing SQLite database adapter...');
      adapterInstance = new SqliteDatabaseAdapter(botConfig.dbPath || './data/bot.sqlite');
      break;
    case 'postgres':
    case 'postgresql':
    case 'supabase':
      logger.info('Initializing PostgreSQL/Supabase database adapter...');
      adapterInstance = new PostgresDatabaseAdapter();
      break;
    case 'json':
    default:
      logger.info('Initializing JSON database adapter...');
      adapterInstance = new JsonDatabaseAdapter(botConfig.dbPath || './data/database.json');
      break;
  }

  return adapterInstance;
};

export const initDatabase = async () => {
  const db = getDatabase();
  await db.connect();
  return db;
};

export const closeDatabase = async () => {
  if (adapterInstance) {
    await adapterInstance.disconnect();
  }
};
