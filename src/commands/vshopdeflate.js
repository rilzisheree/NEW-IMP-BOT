import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { isLT } from '../lib/valorPerms.js';
import ShopItem from '../models/ShopItem.js';

export default {
  data: new SlashCommandBuilder()
    .setName('vshopdeflate')
    .setDescription('Decrease an item\'s price in the shop. (LT only)')
    .addStringOption(opt =>
      opt.setName('name').setDescription('Item name').setRequired(true))
    .addIntegerOption(opt =>
      opt.setName('amount').setDescription('Amount to decrease price by').setRequired(true).setMinValue(1)),

  async execute(interaction) {
    if (!await isLT(interaction.member)) {
      return interaction.reply({ content: 'You need the Loreteam role to use this command.', ephemeral: true });
    }

    const name   = interaction.options.getString('name');
    const amount = interaction.options.getInteger('amount');

    await interaction.deferReply();

    const item = await ShopItem.findOne({
      guildId: interaction.guildId,
      name: { $regex: new RegExp(`^${name}$`, 'i') },
    });

    if (!item) {
      return interaction.editReply({ content: `No item named **${name}** found in the shop.` });
    }

    const newPrice = item.price - amount;
    if (newPrice < 1) {
      return interaction.editReply({ content: `Price cannot go below 1 valor. Current price is **${item.price}**.` });
    }

    item.price = newPrice;
    await item.save();

    const embed = new EmbedBuilder()
      .setColor(0x00b4d8)
      .setTitle('Price Decreased')
      .addFields(
        { name: 'Item',      value: item.name,              inline: true },
        { name: 'Decreased', value: `-${amount}`,           inline: true },
        { name: 'New Price', value: `${newPrice} valor`,    inline: true },
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
