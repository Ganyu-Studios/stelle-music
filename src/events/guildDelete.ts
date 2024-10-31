import { Embed, createEvent } from "seyfert";

export default createEvent({
    data: { name: "guildDelete" },
    run: async ({ id }, client) => {
        const guild = await client.guilds.fetch(id).catch(() => null);
        if (!guild) return;

        const embed = new Embed()
            .setColor(client.config.color.success)
            .setTitle("A guild removed me!")
            .setDescription("`📦` A guild removed me... I think I was not helpful...")
            .addFields(
                { name: "`📜` Name", value: `\`${guild.name}\``, inline: true },
                { name: "`🏮` ID", value: `\`${guild.id}\``, inline: true },
                { name: "`👥` Members", value: `\`${guild.memberCount}\``, inline: true },
            );

        await client.messages.write(client.config.channels.guilds, { embeds: [embed] });
    },
});
