import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { getDatabase } from '../../database/index.js';
import { createSuccessEmbed, createErrorEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setwelcome')
    .setDescription('إعداد قناة وخلفية وعناصر بطاقة الترحيب (بدون أي ثيمات أو طبقات معتمة)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false)
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('قناة إرسال الترحيب')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(true)
    )
    .addBooleanOption(option =>
      option
        .setName('enabled')
        .setDescription('تفعيل أو تعطيل الترحيب')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('background_path')
        .setDescription('مسار صورة الخلفية الخاصة بك بالكامل (مثال: ./assets/welcome-bg.png)')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('custom_text')
        .setDescription('النص الترحيبي (مثال: WELCOME أو أهلاً بك)')
        .setRequired(false)
    )
    .addBooleanOption(option =>
      option
        .setName('show_avatar')
        .setDescription('إظهار أو إخفاء صورة الحساب (Avatar)')
        .setRequired(false)
    )
    .addBooleanOption(option =>
      option
        .setName('show_username')
        .setDescription('إظهار أو إخفاء اسم العضو (Username)')
        .setRequired(false)
    )
    .addBooleanOption(option =>
      option
        .setName('show_welcome_text')
        .setDescription('إظهار أو إخفاء النص الترحيبي (Welcome Text)')
        .setRequired(false)
    )
    .addBooleanOption(option =>
      option
        .setName('show_member_count')
        .setDescription('إظهار أو إخفاء عداد الأعضاء (Member Count)')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('message')
        .setDescription('نص الرسالة المرسلة في الديسكورد (استخدم {user} و {server})')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const channel = interaction.options.getChannel('channel');
    const enabled = interaction.options.getBoolean('enabled') ?? true;
    const message = interaction.options.getString('message');
    const customText = interaction.options.getString('custom_text');
    const backgroundPath = interaction.options.getString('background_path');
    const showAvatar = interaction.options.getBoolean('show_avatar');
    const showUsername = interaction.options.getBoolean('show_username');
    const showWelcomeText = interaction.options.getBoolean('show_welcome_text');
    const showMemberCount = interaction.options.getBoolean('show_member_count');

    const db = getDatabase();
    const currentConfig = await db.getGuildConfig(interaction.guildId);

    const welcomeCardConfig = currentConfig.welcomeCardConfig || {
      avatar: { enabled: true, x: 140, y: 180, size: 120 },
      username: { enabled: true, x: 240, y: 180, fontSize: 34, color: '#ffffff' },
      welcomeText: { enabled: true, text: 'WELCOME', x: 240, y: 120, fontSize: 22, color: '#38bdf8' },
      memberCount: { enabled: false, format: 'Member #{count}', x: 240, y: 225, fontSize: 16, color: '#cbd5e1' }
    };

    if (showAvatar !== null) welcomeCardConfig.avatar.enabled = showAvatar;
    if (showUsername !== null) welcomeCardConfig.username.enabled = showUsername;
    if (showWelcomeText !== null) welcomeCardConfig.welcomeText.enabled = showWelcomeText;
    if (showMemberCount !== null) welcomeCardConfig.memberCount.enabled = showMemberCount;
    if (customText) welcomeCardConfig.welcomeText.text = customText;

    const updatePayload = {
      welcomeChannelId: channel.id,
      welcomeEnabled: enabled,
      welcomeCardConfig
    };

    if (message) updatePayload.welcomeMessage = message;
    if (customText) updatePayload.welcomeCustomText = customText;
    if (backgroundPath) updatePayload.welcomeBackgroundPath = backgroundPath;

    const updated = await db.setGuildConfig(interaction.guildId, updatePayload);

    const embed = createSuccessEmbed(
      'تم تحديث إعدادات الترحيب بنجاح',
      `**القناة:** ${channel}\n` +
      `**الحالة:** ${enabled ? '🟢 مفعل' : '🔴 معطل'}\n` +
      `**صورة الخلفية:** \`${updated.welcomeBackgroundPath || './assets/welcome-bg.png'}\` *(خلفية حرة بدون أي ثيم أو إطار)*\n\n` +
      `**حالة العناصر (Custom Positioning):**\n` +
      `• الصورة الشخصية (Avatar): ${welcomeCardConfig.avatar.enabled ? '🟢 مفعّلة' : '🔴 معطّلة'}\n` +
      `• اسم العضو (Username): ${welcomeCardConfig.username.enabled ? '🟢 مفعّل' : '🔴 معطّل'}\n` +
      `• النص الترحيبي (Welcome Text): ${welcomeCardConfig.welcomeText.enabled ? `🟢 "${welcomeCardConfig.welcomeText.text}"` : '🔴 معطّل ومخفي'}\n` +
      `• عداد الأعضاء (Member Count): ${welcomeCardConfig.memberCount.enabled ? '🟢 مفعّل' : '🔴 مخفي بالكامل'}\n\n` +
      `**الرسالة النصية:** \n${updated.welcomeMessage}`
    );

    await interaction.editReply({ embeds: [embed] });
  }
};
