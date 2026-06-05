import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { isLT } from '../../lib/valorPerms.js';
import Valor from '../../models/Valor.js';
import ValorLog from '../../models/ValorLog.js';

export default {
  data: new SlashCommandBuilder()
    .setName('addvalor')
    .setDescription('Add valor to a user. (LT only) — same as /commend')
    .addUserOption(opt =>
      opt.setName('user').setDescription('User to add valor to').setRequired(true))
    .addIntegerOption(opt =>
      opt.setName('amount').setDescription('Amount of valor to add').setRequired(true).setMinValue(1))
    .addStringOption(opt =>
      opt.setName('note').setDescription('Optional reason/note')),

  async execute(interaction) {
    if (!await isLT(interaction.member)) {
      return interaction.reply({ content: '❌ You need the **Loreteam** role to use this command.', ephemeral: true });
    }

    const target = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');
    const note   = interaction.options.getString('note') || '';

    if (target.bot) {
      return interaction.reply({ content: '❌ You cannot add valor to a bot.', ephemeral: true });
    }

    await interaction.deferReply();

    const record = await Valor.findOneAndUpdate(
      { userId: target.id, guildId: interaction.guildId },
      { $inc: { valor: amount } },
      { upsert: true, new: true }
    );

    await ValorLog.create({
      guildId:    interaction.guildId,
      userId:     target.id,
      executorId: interaction.user.id,
      action:     'ADD',
      amount,
      note,
    });

    const embed = new EmbedBuilder()
      .setColor(0x00c2a8)
      .setTitle('⚔️ Valor Added')
      .setDescription(`**${target.username}** received valor.`)
      .addFields(
        { name: 'Amount Added', value: `+${amount}`,      inline: true },
        { name: 'Total Valor',  value: `${record.valor}`, inline: true },
        { name: 'By',           value: `<@${interaction.user.id}>`, inline: true },
      )
      .setFooter({ text: note ? `Note: ${note}` : 'No note provided.' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
