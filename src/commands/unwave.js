import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { hasPermission } from '../lib/permissions.js';

const WAVE_ROLE_ID   = '1463028818275991685';
const UNWAVE_ROLE_ID = '1444837994270822452';

export const data = new SlashCommandBuilder()
  .setName('unwave')
  .setDescription('Revoke a user\'s access to IMPERIUM — removes member role and restores pending role')
  .addUserOption(opt =>
    opt.setName('user')
      .setDescription('The member to unwave')
      .setRequired(true)
  )
  .addStringOption(opt =>
    opt.setName('reason')
      .setDescription('Reason for removing access (sent to the user)')
      .setRequired(false)
  );

export async function execute(interaction) {
  const allowed = await hasPermission(interaction, 'unwave');
  if (!allowed) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x111111)
          .setDescription('❌ You do not have permission to use `/unwave`.'),
      ],
      ephemeral: true,
    });
  }

  const target = interaction.options.getUser('user');
  const reason = interaction.options.getString('reason') || 'No reason provided';
  const guild  = interaction.guild;

  await interaction.deferReply({ ephemeral: true });

  // ── Fetch member ─────────────────────────────────────────────────────────
  const member = await guild.members.fetch(target.id).catch(() => null);
  if (!member) {
    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x111111)
          .setDescription(`❌ Could not find **${target.tag}** in this server.`),
      ],
    });
  }

  const errors = [];

  // ── Remove wave role ──────────────────────────────────────────────────────
  await member.roles.remove(WAVE_ROLE_ID, `Unwaved by ${interaction.user.tag} — ${reason}`).catch(e => {
    errors.push(`Could not remove wave role: ${e.message}`);
  });

  // ── Re-add pending role ───────────────────────────────────────────────────
  await member.roles.add(UNWAVE_ROLE_ID, `Unwaved by ${interaction.user.tag} — ${reason}`).catch(e => {
    errors.push(`Could not restore pending role: ${e.message}`);
  });

  // ── Notify user via DM ────────────────────────────────────────────────────
  const guildIcon = guild.iconURL({ dynamic: true, size: 256 });

  const notifyEmbed = new EmbedBuilder()
    .setColor(0x111111)
    .setTitle('Your access to IMPERIUM has been revoked.')
    .setThumbnail(guildIcon)
    .setDescription(
      `Your **wave** in **IMPERIUM** has been removed and your access has been revoked.\n\n` +
      `If you believe this was a mistake, please contact a Staff Member.`
    )
    .addFields({ name: 'Reason', value: reason })
    .setFooter({ text: guild.name, iconURL: guildIcon ?? undefined })
    .setTimestamp();

  let dmFailed = false;
  try {
    await target.send({ embeds: [notifyEmbed] });
  } catch {
    dmFailed = true;
  }

  // ── Confirm to staff ──────────────────────────────────────────────────────
  const confirmEmbed = new EmbedBuilder()
    .setColor(0x111111)
    .setTitle('✅ User Unwaved')
    .addFields(
      { name: 'Member',     value: `<@${target.id}> (\`${target.tag}\`)`, inline: true },
      { name: 'Unwaved by', value: `<@${interaction.user.id}>`,           inline: true },
      { name: 'Reason',     value: reason },
      { name: 'Roles',      value: `✅ Removed <@&${WAVE_ROLE_ID}>\n✅ Restored <@&${UNWAVE_ROLE_ID}>` },
    )
    .setTimestamp();

  if (dmFailed) {
    confirmEmbed.addFields({ name: '⚠️ DM', value: "Could not DM the user — their DMs are likely closed." });
  }

  if (errors.length) {
    confirmEmbed.addFields({ name: '⚠️ Errors', value: errors.join('\n') });
  }

  await interaction.editReply({ embeds: [confirmEmbed] });
}
