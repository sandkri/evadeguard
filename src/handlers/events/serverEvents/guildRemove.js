import { handleLeave } from "../../../utility/timeoutManager.js";


export default (client) => {
    client.on("guildMemberRemove", async (member) => {
        await handleLeave(member);
    });
};
