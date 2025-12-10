import { createEvent, Embed } from "seyfert";
import { Constants } from "#stelle/utils/data/constants.js";

export default createEvent({
    data: { name: "guildCreate" },
    async run(guild, client): Promise<void> {
        if (guild.unavailable) return;

        if (Constants.Debug) return client.debugger?.info(`Guild: ${guild.id} | Created: ${guild.name}`);

        const owner = await guild.fetchOwner();
        const embed = new Embed()
            .setColor(client.config.color.success)
            .setTitle("A new guild added me!")
            .setDescription("`📦` A new guild has added me! I hope I can be helpful in this journey.")
            .addFields(
                { name: "`📜` Name", value: `\`${guild.name}\``, inline: true },
                { name: "`👤` Owner", value: `\`${owner?.displayName ?? "Unknown"}\``, inline: true },
                { name: "`🏮` ID", value: `\`${guild.id}\``, inline: true },
                { name: "`👥` Members", value: `\`${guild.memberCount}\``, inline: true },
            );

        await client.messages.write(client.config.channels.guildsId, { embeds: [embed] });
    },
});
