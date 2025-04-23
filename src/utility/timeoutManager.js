// timeoutManager.js
import { Colors, EmbedBuilder } from "discord.js";
import { users } from "../utility/database/data.js";

/**
 * Apply a timeout and store the end timestamp.
 */
export async function applyTimeout(member, duration, reason = "Manual timeout") {
    const userModel = users([member.guild.id, member.id]);
    const timeoutUntil = Date.now() + duration;

    try {
        await member.timeout(duration, reason);
    } catch (err) {
        console.error(`[❌ Error] Failed to timeout ${member.user.tag}:`, err);
        return;
    }

    await userModel.update({
        punishment: {
            evading: false,
            time: timeoutUntil
        }
    });

    console.log(`[✅ Timeout] ${member.user.tag} has been timed out for ${duration}ms.`);
}

/**
 * Handle a user leaving while timed out (escalates the timeout).
 */
export async function handleLeave(member) {
    if (!member.isCommunicationDisabled()) return;

    const remaining = member.communicationDisabledUntilTimestamp - Date.now();
    if (remaining <= 0) return;

    // Escalation logic
    const hour = 60 * 60 * 1000;
    const day = 24 * hour;

    let newTimeout;
    if (remaining <= hour) newTimeout = 6 * hour;
    else if (remaining <= day) newTimeout = 7 * day;
    else newTimeout = 28 * day;

    const userModel = users([member.guild.id, member.id]);

    await userModel.update({
        punishment: {
            evading: true,
            time: Date.now() + newTimeout
        }
    });

    console.log(`[⚠️ Evade] ${member.user.tag} left with ${Math.floor(remaining / 1000)}s left. Escalated to ${Math.floor(newTimeout / 1000)}s.`);
}

/**
 * Handle a user rejoining while evading timeout.
 */
export async function handleJoin(member) {
    const userModel = users([member.guild.id, member.id]);
    const data = await userModel.get();
    const punishment = data?.punishment;

    let timeoutReapplied = false;

    if (punishment?.evading && punishment.time > Date.now()) {
        const remaining = punishment.time - Date.now();

        if (remaining > 0) {
            try {
                await member.timeout(remaining, "Reapplying evaded timeout");

                await userModel.update({
                    punishment: {
                        evading: false,
                        time: punishment.time
                    }
                });

                timeoutReapplied = true;
                console.log(`[🔁 Reapply] ${member.user.tag} was retimed out for ${remaining}ms.`);
            } catch (err) {
                console.error(`[❌ Error] Failed to reapply timeout to ${member.user.tag}:`, err);
            }
        }
    }

    // Build DM embed
    const embed = new EmbedBuilder()
        .setTitle("📌 Welcome to the server")
        .setDescription("This server uses **EvadeGuard** to enforce fair moderation rules.")
        .setColor(timeoutReapplied ? Colors.Red : Colors.Green)
        .setFooter({ text: "EvadeGuard • No punishment escapes" })
        .setTimestamp();

    if (timeoutReapplied) {
        const minutesLeft = Math.max(1, Math.floor((punishment.time - Date.now()) / 60000));

        embed.addFields(
            {
                name: "Punishment Detected",
                value: "``You left while a timeout was active. It has now been reapplied.``",
                inline: false
            },
            {
                name: "New Timeout Duration",
                value: `\`\`${minutesLeft} minutes remaining\`\``,
                inline: false
            }
        );
    } else {
        embed.addFields({
            name: "Status",
            value: "``✅ No active punishments found on your return.``",
            inline: false
        });
    }

    try {
        await member.send({ embeds: [embed] });
    } catch (err) {
        console.warn(`[📪 DM] Could not send DM to ${member.user.tag}. DMs may be closed.`);
    }
}
