import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { isLT } from '../../lib/valorPerms.js';
import Valor from '../../models/Valor.js';
import ValorLog from '../../models/ValorLog.js';

export default {
  data: new SlashCommandBuilder()
    .setName('removevalor')
    .setDescription('Remove valor from a user as a penalty or correction. (LT only)')
    .addUserOption(opt =>
      opt.setName('user').setDescription('User to penalize').setRequired(true))
    .addIntegerOption(opt =>
      opt.setName('amount').setDescription('Amount of valor to remove').setRequired(true).setMinValue(1))
    .addStringOption(opt =>
      opt.setName('reason').setDescription('Reason for removal')),

  async execute(interaction) {
    if (!await isLT(interaction.member)) {
      return interaction.reply({ content: '❌ You need the **Loreteam** role to use this command.', ephemeral: true });
    }

    const target = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');
    const reason = interaction.options.getString('reason') || '';

    if (target.bot) {
      return interaction.reply({ content: '❌ You cannot remove valor from a bot.', ephemeral: true });
    }

    await interaction.deferReply();

    const existing = await Valor.findOne({ userId: target.id, guildId: interaction.guildId });
    const current  = existing?.valor ?? 0;

    if (current === 0) {
      return interaction.editReply({ content: `❌ **${target.username}** has no valor to remove.` });
    }

    // Clamp — can't go below 0
    const actualRemove = Math.min(amount, current);
    const record = await Valor.findOneAndUpdate(
      { userId: target.id, guildId: interaction.guildId },
      { $inc: { valor: -actualRemove } },
      { upsert: true, new: true }
    );

    await ValorLog.create({
      guildId:    interaction.guildId,
      userId:     target.id,
      executorId: interaction.user.id,
      action:     'REMOVE',
      amount:     -actualRemove,
      note:       reason,
    });

    const clamped = actualRemove < amount
      ? `\n⚠️ Only **${actualRemove}** removed (user had ${current}, can't go below 0).`
      : '';

    const embed = new EmbedBuilder()
      .setColor(0xed4245)
      .setTitle('⚔️ Valor Removed')
      .setDescription(`**${target.username}**'s valor has been reduced.${clamped}`)
      .addFields(
        { name: 'Removed',      value: `-${actualRemove}`,    inline: true },
        { name: 'Remaining',    value: `${record.valor}`,     inline: true },
        { name: 'By',           value: `<@${interaction.user.id}>`, inline: true },
      )
      .setFooter({ text: reason ? `Reason: ${reason}` : 'No reason provided.' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
