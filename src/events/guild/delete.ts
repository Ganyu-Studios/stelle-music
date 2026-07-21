import { createEvent, Guild } from "seyfert";
import { StelleMeta } from "#stelle/utils/data/constants.js";
import { sendGuildLog } from "#stelle/utils/functions/utils.js";

export default createEvent({
    data: { name: "guildDelete" },
    async run(guild, client): Promise<void> {
        if (guild.unavailable || !(guild instanceof Guild)) return;

        if (StelleMeta.Debug) return client.debugger?.info(`[Guild] Deleted | id: ${guild.id} | name: ${guild.name}`);

        await sendGuildLog(client, guild, {
            color: "Red",
            title: "A guild removed me!",
            description: "`📦` A guild removed me... I think I was not helpful...",
        });
    },
});
