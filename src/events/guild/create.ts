import { createEvent } from "seyfert";
import { StelleMeta } from "#stelle/utils/data/constants.js";
import { sendGuildLog } from "#stelle/utils/functions/internal/discord.js";

export default createEvent({
    data: { name: "guildCreate" },
    async run(guild, client): Promise<void> {
        if (guild.unavailable) return;

        if (StelleMeta.Debug) return client.debugger?.info(`[Guild] Created | id: ${guild.id} | name: ${guild.name}`);

        await sendGuildLog(client, guild, {
            color: client.config.color.success,
            title: "A new guild added me!",
            description: "`📦` A new guild has added me! I hope I can be helpful in this journey.",
        });
    },
});
