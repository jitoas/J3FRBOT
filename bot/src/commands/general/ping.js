import { SlashCommandBuilder } from 'discord.js';
import { createBaseEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('فحص سرعة استجابة البوت واستقرار الاتصال (Ping & Latency)'),

  async execute(interaction) {
    const sent = await interaction.deferReply({ fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const wsPing = interaction.client.ws.ping;

    const embed = createBaseEmbed({
      title: '🏓 Pong! حالة الاتصال',
      fields: [
        { name: '⏱️ تأخير الاستجابة (Roundtrip)', value: `\`${latency}ms\``, inline: true },
        { name: '📡 اتصال WebSocket', value: `\`${wsPing >= 0 ? `${wsPing}ms` : 'جاري الحساب...'}\``, inline: true },
        { name: '🟢 حالة الخادم', value: '`متصل ومستقر`', inline: true }
      ]
    });

    await interaction.editReply({ embeds: [embed] });
  }
};
