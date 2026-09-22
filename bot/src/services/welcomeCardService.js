import fs from 'fs';
import path from 'path';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { logger } from '../utils/logger.js';

export class WelcomeCardService {
  /**
   * Generates a high-quality Welcome Image buffer using Canvas with custom positioning.
   * Completely clean: No themes, no overlays, no frames, no automatic gradients.
   * The user's uploaded image is the 100% untouched background.
   *
   * @param {Object} options
   * @param {string} options.username - Member username
   * @param {string} options.avatarUrl - URL to user avatar
   * @param {string} [options.serverName] - Server name
   * @param {number} [options.memberCount] - Current total member count
   * @param {string} [options.backgroundPath] - Local file path or data URI for custom background
   * @param {Object} [options.cardConfig] - Custom positioning and toggle settings for elements
   * @returns {Promise<Buffer>} PNG image buffer
   */
  static async generateCard({
    username = 'New Member',
    avatarUrl,
    serverName = 'Discord Server',
    memberCount = 1,
    backgroundPath = './assets/welcome-bg.png',
    cardConfig = {}
  }) {
    const width = 800;
    const height = 360;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Default configuration with custom positioning
    const config = {
      avatar: {
        enabled: true,
        x: 140,
        y: 180,
        size: 120,
        ...cardConfig?.avatar
      },
      username: {
        enabled: true,
        x: 240,
        y: 180,
        fontSize: 34,
        color: '#ffffff',
        ...cardConfig?.username
      },
      welcomeText: {
        enabled: true,
        text: 'WELCOME',
        x: 240,
        y: 120,
        fontSize: 22,
        color: '#38bdf8',
        ...cardConfig?.welcomeText
      },
      memberCount: {
        enabled: false,
        format: 'Member #{count}',
        x: 240,
        y: 225,
        fontSize: 16,
        color: '#cbd5e1',
        ...cardConfig?.memberCount
      }
    };

    // 1. Draw 100% Pure Background (No tint, No overlay, No border, No glow)
    let hasDrawnBg = false;
    if (backgroundPath) {
      try {
        const resolvedBg = path.resolve(backgroundPath);
        if (fs.existsSync(resolvedBg)) {
          const bgImg = await loadImage(resolvedBg);
          ctx.drawImage(bgImg, 0, 0, width, height);
          hasDrawnBg = true;
        }
      } catch (err) {
        logger.warn(`Could not load background at ${backgroundPath}: ${err.message}`);
      }
    }

    if (!hasDrawnBg) {
      // Solid clean neutral canvas if no user image exists yet
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Draw Avatar (if enabled)
    if (config.avatar.enabled) {
      const avX = config.avatar.x;
      const avY = config.avatar.y;
      const avRadius = Math.max(10, Math.floor(config.avatar.size / 2));

      ctx.save();
      ctx.beginPath();
      ctx.arc(avX, avY, avRadius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      try {
        if (avatarUrl) {
          const avatarImg = await loadImage(avatarUrl);
          ctx.drawImage(
            avatarImg,
            avX - avRadius,
            avY - avRadius,
            avRadius * 2,
            avRadius * 2
          );
        } else {
          ctx.fillStyle = '#374151';
          ctx.fillRect(avX - avRadius, avY - avRadius, avRadius * 2, avRadius * 2);
        }
      } catch (err) {
        logger.warn(`Could not load avatar: ${err.message}`);
        ctx.fillStyle = '#374151';
        ctx.fillRect(avX - avRadius, avY - avRadius, avRadius * 2, avRadius * 2);
      }
      ctx.restore();
    }

    // 3. Draw Welcome Text (if enabled)
    if (config.welcomeText.enabled && config.welcomeText.text?.trim()) {
      const textX = config.welcomeText.x;
      const textY = config.welcomeText.y;
      const fontSize = Math.max(8, config.welcomeText.fontSize || 22);
      const color = config.welcomeText.color || '#38bdf8';

      ctx.save();
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.fillStyle = color;
      ctx.textBaseline = 'middle';
      
      const formattedText = config.welcomeText.text
        .replace(/{user}/g, username)
        .replace(/{server}/g, serverName)
        .replace(/{count}/g, memberCount.toString());

      ctx.fillText(formattedText, textX, textY);
      ctx.restore();
    }

    // 4. Draw Username (if enabled)
    if (config.username.enabled) {
      const userX = config.username.x;
      const userY = config.username.y;
      const fontSize = Math.max(10, config.username.fontSize || 34);
      const color = config.username.color || '#ffffff';

      ctx.save();
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.fillStyle = color;
      ctx.textBaseline = 'middle';
      ctx.fillText(username, userX, userY);
      ctx.restore();
    }

    // 5. Draw Member Count (if enabled)
    if (config.memberCount.enabled) {
      const countX = config.memberCount.x;
      const countY = config.memberCount.y;
      const fontSize = Math.max(8, config.memberCount.fontSize || 16);
      const color = config.memberCount.color || '#cbd5e1';

      const formatTemplate = config.memberCount.format || 'Member #{count}';
      const countText = formatTemplate.replace(/{count}/g, memberCount.toString());

      ctx.save();
      ctx.font = `600 ${fontSize}px sans-serif`;
      ctx.fillStyle = color;
      ctx.textBaseline = 'middle';
      ctx.fillText(countText, countX, countY);
      ctx.restore();
    }

    return canvas.toBuffer('image/png');
  }
}
