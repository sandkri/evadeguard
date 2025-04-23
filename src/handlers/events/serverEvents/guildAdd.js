import { handleJoin } from "../../../utility/timeoutManager.js";



export default (client) => {
    client.on("guildMemberAdd", async (member) => {
        await handleJoin(member);
    });
};
