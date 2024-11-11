import { Embed, Guild, createEvent } from "seyfert";

export default createEvent({
    data: { name: "guildDelete" },
    run: async (guild, client) => {
        if (guild.unavailable) return;
        if (!(guild instanceof Guild)) return;

        const embed = new Embed()
            .setColor(client.config.color.success)
            .setTitle("A guild removed me!")
            .setDescription("`📦` A guild removed me... I think I was not helpful...")
            .addFields(
                { name: "`📜` Name", value: `\`${guild.name}\``, inline: true },
                { name: "`🏮` ID", value: `\`${guild.id}\``, inline: true },
                { name: "`👥` Members", value: `\`${guild.memberCount}\``, inline: true },
            );

        await client.messages.write(client.config.channels.guildsId, { embeds: [embed] });
    },
});
