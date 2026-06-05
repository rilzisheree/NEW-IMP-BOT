import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import ShopItem from '../models/ShopItem.js';

export default {
  data: new SlashCommandBuilder()
    .setName('vshopcheck')
    .setDescription('See what\'s available in the valor shop.'),

  async execute(interaction) {
    await interaction.deferReply();

    const items = await ShopItem.find({ guildId: interaction.guildId }).sort({ price: 1 });

    if (!items.length) {
      return interaction.editReply({ content: 'The valor shop is currently empty.' });
    }

    const embed = new EmbedBuilder()
      .setColor(0xfee75c)
      .setTitle('Valor Shop')
      .setDescription('Use `/purchase` to buy an item.')
      .setTimestamp();

    for (const item of items) {
      embed.addFields({
        name:   `${item.name} — ${item.price} valor`,
        value:  item.description || 'No description.',
        inline: false,
      });
    }

    await interaction.editReply({ embeds: [embed] });
  },
};
