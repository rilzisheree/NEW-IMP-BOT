import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { hasPermission } from '../lib/permissions.js';

const WAVE_ROLE_ID   = '1511362410005663925';
const UNWAVE_ROLE_ID = '1511362426774225037';

export const data = new SlashCommandBuilder()
  .setName('wave')
  .setDescription('Wave a user into IMPERIUM — grants access and sends them the welcome embed')
  .addUserOption(opt =>
    opt.setName('user')
      .setDescription('The member to wave in')
      .setRequired(true)
  );

export async function execute(interaction) {
  const allowed = await hasPermission(interaction, 'wave');
  if (!allowed) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x111111)
          .setDescription('❌ You do not have permission to use `/wave`.'),
      ],
      ephemeral: true,
    });
  }

  const target = interaction.options.getUser('user');
  const guild  = interaction.guild;

  await interaction.deferReply({ ephemeral: true });

  // ── Role changes ────────────────────────────────────────────────────────
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

  if (guild.members.me.roles.highest.comparePositionTo(
    guild.roles.cache.get(WAVE_ROLE_ID) ?? { position: 0 }
  ) > 0) {
    await member.roles.add(WAVE_ROLE_ID, `Waved in by ${interaction.user.tag}`).catch(e => {
      errors.push(`Could not add wave role: ${e.message}`);
    });
  } else {
    errors.push('Bot role is too low to assign the wave role.');
  }

  await member.roles.remove(UNWAVE_ROLE_ID, `Waved in by ${interaction.user.tag}`).catch(() => {});

  // ── Welcome embed ────────────────────────────────────────────────────────
  const guildIcon = guild.iconURL({ dynamic: true, size: 256 });

  const welcomeEmbed = new EmbedBuilder()
    .setColor(0x111111)
    .setTitle('You have been waved in IMPERIUM!')
    .setThumbnail(guildIcon)
    .setDescription(
      `Welcome to **IMPERIUM!** **IMPERIUM** is a **hardcore** game with **permanent death**. ` +
      `Losing characters is **part** of the experience.\n\n` +
      `You've been accepted and have been **waved**, and now have **full access** to join IMPERIUM.`
    )
    .addFields({
      name: 'How to get started?',
      value:
        `Please read and follow the general and lore rules stated in the server. ` +
        `You may also ask for help from Staff Members or other community members.\n\n` +
        `Join the IMPERIUM-**affiliated servers**, such as "Lore Information" and "Support" servers, ` +
        `for further information.\n\n` +
        `We're excited to see the path you carve out in **IMPERIUM**. There's a lot ahead of you, ` +
        `and we can't wait to watch you **grow**, push your **limits**, and make your **mark**. ` +
        `Good luck, and **enjoy** every step of the journey!`,
    })
    .setFooter({ text: guild.name, iconURL: guildIcon ?? undefined })
    .setTimestamp();

  // ── Send DM ──────────────────────────────────────────────────────────────
  let dmFailed = false;
  try {
    await target.send({ embeds: [welcomeEmbed] });
  } catch {
    dmFailed = true;
  }

  // ── Confirm to staff ─────────────────────────────────────────────────────
  const confirmEmbed = new EmbedBuilder()
    .setColor(0x111111)
    .setTitle('✅ User Waved')
    .addFields(
      { name: 'Member',   value: `<@${target.id}> (\`${target.tag}\`)`, inline: true },
      { name: 'Waved by', value: `<@${interaction.user.id}>`,           inline: true },
      { name: 'Roles',    value: `✅ Granted <@&${WAVE_ROLE_ID}>\n✅ Removed <@&${UNWAVE_ROLE_ID}>` },
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
