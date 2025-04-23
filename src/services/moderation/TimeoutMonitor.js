import { users, getDB } from "../../utility/database/data.js";

export default (client) => {
  const db = getDB();

  setInterval(async () => {
    const allEntries = await db.all();
    for (const { id: key, value } of allEntries) {
      if (!key.startsWith("users_")) continue;

      const parts = key.split("_");
      if (parts.length < 3) continue;

      const [, guildId, userId] = parts;
      const punishment = value?.punishment;

      if (!punishment || !punishment.time || punishment.evading) continue;

      const guild = client.guilds.cache.get(guildId);
      if (!guild) continue;

      let member = guild.members.cache.get(userId);

      if (!member) {
        try {
          member = await guild.members.fetch(userId);
        } catch (err) {
          console.warn(`[⚠️] Couldn't fetch ${userId} in ${guild.name}: ${err.message}`);
          continue;
        }
      }

      const until = punishment.time;
      const stillTimedOut = until > Date.now();
      
      const actualTimedOut = member.communicationDisabledUntilTimestamp;
      const timeoutRemovedManually = stillTimedOut && (!actualTimedOut || actualTimedOut < Date.now());

      if (!stillTimedOut || timeoutRemovedManually) {
        const userModel = users([guildId, userId]);

        await userModel.update({
          punishment: {
            evading: false,
            time: 0
          }
        });

        console.log(`[${timeoutRemovedManually ? '🔄 Cleared' : '⏱️ Expired'}] Timeout for ${member.user.tag} in ${guild.name}`);
      }
    }
  }, 30 * 1000);
};