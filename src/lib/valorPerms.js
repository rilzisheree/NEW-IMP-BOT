import { OWNER_IDS } from '../config.js';
import LoreteamRole from '../models/LoreteamRole.js';

/**
 * Returns true if the user is a bot owner (from config.js).
 */
export function isOwner(userId) {
  return OWNER_IDS.includes(userId);
}

/**
 * Returns true if the member is a bot owner OR has the LT role for this guild.
 */
export async function isLT(member) {
  if (isOwner(member.id)) return true;

  const doc = await LoreteamRole.findOne({ guildId: member.guild.id });
  if (!doc) return false;
  return member.roles.cache.has(doc.roleId);
}
