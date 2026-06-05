import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { isOwner, isLT } from '../lib/valorPerms.js';
import ValorChannel from '../models/ValorChannel.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setvalorchannel')
    .setDescription('Set the channel where valor actions are automatically logged. (LT only)')
    .addChannelOption(opt =>
      opt.setName('channel').setDescription('Channel to send valor logs to').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    if (!await isLT(interaction.member)) {
      return interaction.reply({ content: 'You need the Loreteam role to use this command.', ephemeral: true });
    }

    const channel = interaction.options.getChannel('channel');

    await interaction.deferReply();

    await ValorChannel.findOneAndUpdate(
      { guildId: interaction.guildId },
      { channelId: channel.id },
      { upsert: true }
    );

    const embed = new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle('Valor Log Channel Set')
      .setDescription(`Valor actions will now be automatically posted to <#${channel.id}>.`)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
