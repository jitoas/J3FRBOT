const levels = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  gray: '\x1b[90m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m'
};

const currentLevel = process.env.LOG_LEVEL?.toLowerCase() || 'info';

const formatTimestamp = () => {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
};

export const logger = {
  debug: (...args) => {
    if (levels[currentLevel] <= levels.debug) {
      console.log(
        `${colors.gray}[${formatTimestamp()}]${colors.reset} ${colors.cyan}[DEBUG]${colors.reset}`,
        ...args
      );
    }
  },
  
  info: (...args) => {
    if (levels[currentLevel] <= levels.info) {
      console.log(
        `${colors.gray}[${formatTimestamp()}]${colors.reset} ${colors.green}[INFO]${colors.reset}`,
        ...args
      );
    }
  },
  
  warn: (...args) => {
    if (levels[currentLevel] <= levels.warn) {
      console.warn(
        `${colors.gray}[${formatTimestamp()}]${colors.reset} ${colors.yellow}[WARN]${colors.reset}`,
        ...args
      );
    }
  },
  
  error: (...args) => {
    if (levels[currentLevel] <= levels.error) {
      console.error(
        `${colors.gray}[${formatTimestamp()}]${colors.reset} ${colors.red}[ERROR]${colors.reset}`,
        ...args
      );
    }
  },

  bot: (...args) => {
    console.log(
      `${colors.gray}[${formatTimestamp()}]${colors.reset} ${colors.magenta}[BOT]${colors.reset}`,
      ...args
    );
  }
};
