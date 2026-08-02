import { createEvent } from "seyfert";
import { StelleMeta } from "#stelle/utils/data/constants.js";
import { DiscordOps } from "#stelle/utils/functions/internal/discord.js";

export default createEvent({
    data: { name: "guildCreate" },
    async run(guild, client): Promise<void> {
        if (guild.unavailable) return;

        // We check `StelleMeta.Debug` here, and then `client.debug` checks it again inside — belt and suspenders...
        if (StelleMeta.Debug) return client.debug(`[Guild] Created | id: ${guild.id} | name: ${guild.name}`);

        await DiscordOps.guildLog(client, guild, {
            color: client.config.color.success,
            title: "A new guild added me!",
            description: "`📦` A new guild has added me! I hope I can be helpful in this journey.",
        });
    },
});
