import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { isLT } from '../../lib/valorPerms.js';
import ShopItem from '../../models/ShopItem.js';

export default {
  data: new SlashCommandBuilder()
    .setName('vshopinflate')
    .setDescription('Increase an item\'s price in the valor shop. (LT only)')
    .addStringOption(opt =>
      opt.setName('name').setDescription('Item name').setRequired(true))
    .addIntegerOption(opt =>
      opt.setName('amount').setDescription('Amount to increase price by').setRequired(true).setMinValue(1)),

  async execute(interaction) {
    if (!await isLT(interaction.member)) {
      return interaction.reply({ content: '❌ You need the **Loreteam** role to use this command.', ephemeral: true });
    }

    const name   = interaction.options.getString('name');
    const amount = interaction.options.getInteger('amount');

    await interaction.deferReply();

    const item = await ShopItem.findOneAndUpdate(
      { guildId: interaction.guildId, name: { $regex: new RegExp(`^${name}$`, 'i') } },
      { $inc: { price: amount } },
      { new: true }
    );

    if (!item) {
      return interaction.editReply({ content: `❌ No item named **${name}** found in the shop.` });
    }

    const embed = new EmbedBuilder()
      .setColor(0xffa500)
      .setTitle('📈 Price Increased')
      .addFields(
        { name: 'Item',      value: item.name,            inline: true },
        { name: 'Increased', value: `+${amount}`,         inline: true },
        { name: 'New Price', value: `${item.price} valor`, inline: true },
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
