import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { isLT } from '../../lib/valorPerms.js';
import Valor from '../../models/Valor.js';

export default {
  data: new SlashCommandBuilder()
    .setName('checkvalor')
    .setDescription('Check a user\'s valor. Players can only check their own.')
    .addUserOption(opt =>
      opt.setName('user').setDescription('User to check (LT only for others)')),

  async execute(interaction) {
    const lt = await isLT(interaction.member);
    const target = interaction.options.getUser('user');

    if (target && !lt) {
      return interaction.reply({ content: '❌ You can only check your own valor. Use `/checkvalor` without specifying a user.', ephemeral: true });
    }

    const resolvedUser = target ?? interaction.user;

    await interaction.deferReply();

    const record = await Valor.findOne({ userId: resolvedUser.id, guildId: interaction.guildId });
    const valor = record?.valor ?? 0;

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('⚔️ Valor Balance')
      .setDescription(`<@${resolvedUser.id}>'s current valor`)
      .addFields({ name: 'Valor', value: `${valor}`, inline: true })
      .setThumbnail(resolvedUser.displayAvatarURL())
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
