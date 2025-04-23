import { Colors, EmbedBuilder } from "discord.js";
import { users } from "../../../utility/database/data.js";

/**
 * Handles guild member update events, specifically for timeout detection
 * @param {Client} client - Discord.js client
 */
export default (client) => {
  client.on("guildMemberUpdate", async (oldMember, newMember) => {
    const guild = newMember.guild;
    const user = newMember.user;

    if (!guild || !user || !guild.id || !user.id) {
      console.warn(`[⚠️ Skipped] Missing guild or user on guildMemberUpdate.`);
      return;
    }

    // More reliable timeout detection logic
    const wasTimedOut = oldMember.communicationDisabledUntilTimestamp;
    const isTimedOut = newMember.communicationDisabledUntilTimestamp;

    // Check if timeout is new or changed
    const timeoutAdded = !wasTimedOut && isTimedOut;
    const timeoutChanged = wasTimedOut && isTimedOut && wasTimedOut !== isTimedOut;
    
    if (!timeoutAdded && !timeoutChanged) {
      return; // No timeout change detected
    }
    
    console.log(`[EvadeGuard] Timeout detected for ${user.tag}: Old=${wasTimedOut}, New=${isTimedOut}`);

    const durationMs = isTimedOut - Date.now();
    const minutes = Math.max(1, Math.floor(durationMs / 60000));

    try {
      const userModel = users([guild.id, user.id]);

      // Get current data first to check if we need to update
      const currentData = await userModel.get();
      
      // Only update if the timestamp has changed to avoid duplicate processing
      if (!currentData?.punishment?.time || currentData.punishment.time !== isTimedOut) {
        await userModel.update({
          punishment: {
            evading: false,
            time: isTimedOut
          }
        });
        
        const embed = new EmbedBuilder()
          .setTitle("You've Been Timed Out")
          .setDescription(
            `You have been timed out in **${guild.name}** for **${minutes} minute(s)**.\n\n` +
            `**Do not leave the server**,\nor your punishment will automatically escalate to a longer timeout.`
          )
          .setColor(Colors.Orange)
          .setFooter({ text: "EvadeGuard • Smart Moderation" })
          .setTimestamp();

        try {
          await newMember.send({ embeds: [embed] });
        } catch (dmError) {
          console.warn(`⚠️ Could not DM ${user?.tag ?? user?.id ?? "unknown user"}`);
        }

        console.log(`[EvadeGuard] Logged timeout for ${user.tag} (${minutes} min)`);
      } else {
        console.log(`[EvadeGuard] Skipped duplicate timeout update for ${user.tag}`);
      }
    } catch (error) {
      console.error(`[EvadeGuard] Error processing timeout for ${user?.tag ?? user?.id ?? "unknown"}:`, error);
    }
  });
};