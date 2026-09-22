import { EmbedBuilder } from 'discord.js';
import { botConfig } from '../config/botConfig.js';

export const createBaseEmbed = (options = {}) => {
  const embed = new EmbedBuilder()
    .setColor(options.color || botConfig.defaults.embedColor)
    .setTimestamp(options.timestamp || new Date());

  if (options.title) embed.setTitle(options.title);
  if (options.description) embed.setDescription(options.description);
  if (options.thumbnail) embed.setThumbnail(options.thumbnail);
  if (options.image) embed.setImage(options.image);
  if (options.author) embed.setAuthor(options.author);
  if (options.footer) embed.setFooter(options.footer);
  if (options.fields && Array.isArray(options.fields)) {
    embed.addFields(options.fields);
  }

  return embed;
};

export const createSuccessEmbed = (title, description) => {
  return createBaseEmbed({
    title: `✅ ${title}`,
    description,
    color: botConfig.defaults.successColor
  });
};

export const createErrorEmbed = (title, description) => {
  return createBaseEmbed({
    title: `❌ ${title}`,
    description,
    color: botConfig.defaults.dangerColor
  });
};

export const createWarningEmbed = (title, description) => {
  return createBaseEmbed({
    title: `⚠️ ${title}`,
    description,
    color: botConfig.defaults.warningColor
  });
};

export const createLogEmbed = ({
  eventType,
  title,
  description,
  color,
  user,
  executor,
  fields = []
}) => {
  const embed = createBaseEmbed({
    title,
    description,
    color: color || botConfig.defaults.infoColor
  });

  if (user) {
    embed.setThumbnail(user.displayAvatarURL?.({ forceStatic: false, size: 256 }) || user.avatarURL || null);
  }

  const allFields = [...fields];

  if (executor) {
    allFields.push({
      name: '🛡️ تم بواسطة (Executor)',
      value: `${executor.tag || executor.username} (\`${executor.id}\`)`,
      inline: true
    });
  }

  if (allFields.length > 0) {
    embed.addFields(allFields);
  }

  embed.setFooter({
    text: `حدث: ${eventType} • Bot Master Logs`
  });

  return embed;
};
