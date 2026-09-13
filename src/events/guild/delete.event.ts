import { createEvent, Guild, LogLevels } from "seyfert";
import { StelleMeta } from "#stelle/utils/data/constants.js";
import { DiscordOps } from "#stelle/utils/functions/internal/discord.js";

export default createEvent({
    data: { name: "guildDelete" },
    async run(guild, client): Promise<void> {
        if (guild.unavailable || !(guild instanceof Guild)) return;

        // ...and when a guild leaves, the suspenders get their own belt. Two checks in, two checks out — balance.
        if (StelleMeta.Debug) return client.debug(LogLevels.Info, `[Guild] Deleted | id: ${guild.id} | name: ${guild.name}`);

        await DiscordOps.guildLog(client, guild, {
            color: "Red",
            title: "A guild removed me!",
            description: "`📦` A guild removed me... I think I was not helpful...",
        });
    },
});
