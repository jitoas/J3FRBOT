import { AuditLogEvent } from 'discord.js';
import { logger } from './logger.js';

/**
 * Safely fetches recent audit log entry for a specific action and target
 * without failing or throwing if bot lacks ViewAuditLog permission.
 */
export const fetchRecentAuditLog = async (guild, actionType, targetId = null, maxAgeMs = 5000) => {
  if (!guild || !guild.members.me?.permissions.has('ViewAuditLog')) {
    return null;
  }

  try {
    const fetchedLogs = await guild.fetchAuditLogs({
      limit: 5,
      type: actionType
    });

    const now = Date.now();
    const entry = fetchedLogs.entries.find(e => {
      const isTargetMatch = targetId ? e.target?.id === targetId : true;
      const isRecent = (now - e.createdTimestamp) < maxAgeMs;
      return isTargetMatch && isRecent;
    });

    return entry || null;
  } catch (error) {
    logger.debug(`Audit log fetch failed for guild ${guild.id}: ${error.message}`);
    return null;
  }
};
