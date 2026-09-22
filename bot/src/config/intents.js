import { GatewayIntentBits, Partials, PermissionFlagsBits } from 'discord.js';

/**
 * Carefully selected Gateway Intents.
 * Notice: We ONLY request the strictly required intents without unnecessary bloat.
 * Note: GuildMembers and MessageContent are Privileged Intents that must be toggled in Discord Developer Portal.
 */
export const botIntents = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMembers,        // For welcome system, member join/leave logs, moderation
  GatewayIntentBits.GuildModeration,     // For ban/unban events and audit log inspection
  GatewayIntentBits.GuildMessages,       // For message delete/edit logs
  GatewayIntentBits.GuildVoiceStates,    // For voice join/leave/switch logs
  GatewayIntentBits.MessageContent       // For message update logging diffs and future XP hook
];

/**
 * Discord Partials to handle uncached messages and reactions gracefully.
 */
export const botPartials = [
  Partials.Message,
  Partials.Channel,
  Partials.GuildMember,
  Partials.User
];

/**
 * Required Permissions (Integer calculation for Invite Link generator)
 * View Channels, Send Messages, Read Message History, Embed Links, Attach Files,
 * View Audit Log, Manage Messages, Kick Members, Ban Members, Manage Roles.
 */
export const requiredPermissions = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.ReadMessageHistory,
  PermissionFlagsBits.EmbedLinks,
  PermissionFlagsBits.AttachFiles,
  PermissionFlagsBits.ViewAuditLog,
  PermissionFlagsBits.ManageMessages,
  PermissionFlagsBits.KickMembers,
  PermissionFlagsBits.BanMembers,
  PermissionFlagsBits.ModerateMembers,
  PermissionFlagsBits.ManageRoles
];

// Calculate bitwise permissions integer for invite generation
export const calculatePermissionsBitwise = () => {
  return requiredPermissions.reduce((acc, perm) => acc | perm, 0n).toString();
};
