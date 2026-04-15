import { createEvent, Embed, Guild } from "seyfert";
import { Constants } from "#stelle/utils/data/constants.js";

export default createEvent({
    data: { name: "guildDelete" },
    async run(guild, client): Promise<void> {
        if (guild.unavailable || !(guild instanceof Guild)) return;

        if (Constants.Debug) return client.debugger?.info(`[Guild] Deleted | id: ${guild.id} | name: ${guild.name}`);

        const owner = await guild.fetchOwner().catch((): null => null);
        const ownerName = owner?.displayName ?? "Unknown";

        const embed = new Embed()
            .setColor("Red")
            .setTitle("A guild removed me!")
            .setDescription("`📦` A guild removed me... I think I was not helpful...")
            .addFields(
                { name: "`📜` Name", value: `\`${guild.name}\``, inline: true },
                { name: "`👤` Owner", value: `\`${ownerName}\``, inline: true },
                { name: "`🏮` ID", value: `\`${guild.id}\``, inline: true },
                { name: "`👥` Members", value: `\`${guild.memberCount}\``, inline: true },
            );

        await client.messages.write(client.config.channels.guildsId, { embeds: [embed] });
    },
});
