import { SlashCommandBuilder } from 'discord.js';
import { createBaseEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('عرض قائمة الأوامر وشرح وظائف البوت'),

  async execute(interaction) {
    const embed = createBaseEmbed({
      title: '🤖 دليل أوامر البوت (Bot Command Guide)',
      description: 'بوت ديسكورد متكامل مصمم بأعلى معايير الأمان والتنظيم البرمجي.',
      fields: [
        {
          name: '🛡️ أوامر الإشراف (Moderation)',
          value: '• `/kick <target> [reason]` - طرد عضو من السيرفر مع فحص الرتب.\n• `/ban <target> [reason] [days]` - حظر عضو من السيرفر نهائيًا.\n• `/unban <user_id> [reason]` - فك الحظر عن عضو بواسطة ID.\n• `/timeout <user> <duration> [reason]` - عزل عضو مؤقتًا ومنعه من التفاعل.\n• `ti @user 10m [reason]` - اختصار أمر العزل بالبادئة السريعة.'
        },
        {
          name: '⚙️ أوامر التهيأة والإعداد (Configuration)',
          value: '• `/setwelcome <channel> [enabled] [message] [theme] [custom_text] [background_path]` - تخصيص الترحيب والبطاقة.\n• `/setlogs <channel> [enabled]` - تحديد قناة السجلات الشاملة.\n• `/setcommands <channel>` - تحديد قناة حصرية لأوامر البوت والإدارة.\n• `/config` - استعراض الإعدادات الحالية للسيرفر والقنوات الثلاث.'
        },
        {
          name: 'ℹ️ أوامر عامة (General)',
          value: '• `/ping` - فحص سرعة استجابة البوت وخوادم ديسكورد.\n• `/help` - عرض هذه الرسالة الإرشادية.'
        }
      ]
    });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
