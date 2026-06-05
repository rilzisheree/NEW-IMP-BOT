import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { isLT } from '../../lib/valorPerms.js';
import ShopItem from '../../models/ShopItem.js';

export default {
  data: new SlashCommandBuilder()
    .setName('vshopadd')
    .setDescription('Add an item to the valor shop. (LT only)')
    .addStringOption(opt =>
      opt.setName('name').setDescription('Item name').setRequired(true))
    .addIntegerOption(opt =>
      opt.setName('price').setDescription('Price in valor').setRequired(true).setMinValue(1))
    .addStringOption(opt =>
      opt.setName('description').setDescription('Item description')),

  async execute(interaction) {
    if (!await isLT(interaction.member)) {
      return interaction.reply({ content: '❌ You need the **Loreteam** role to use this command.', ephemeral: true });
    }

    const name        = interaction.options.getString('name');
    const price       = interaction.options.getInteger('price');
    const description = interaction.options.getString('description') || '';

    await interaction.deferReply();

    const existing = await ShopItem.findOne({ guildId: interaction.guildId, name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existing) {
      return interaction.editReply({ content: `❌ An item named **${name}** already exists. Use \`/vshopinflate\` or \`/vshopdeflate\` to change its price.` });
    }

    await ShopItem.create({ guildId: interaction.guildId, name, price, description });

    const embed = new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle('🛒 Item Added to Shop')
      .addFields(
        { name: 'Item',        value: name,              inline: true },
        { name: 'Price',       value: `${price} valor`,  inline: true },
        { name: 'Description', value: description || 'None', inline: false },
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
