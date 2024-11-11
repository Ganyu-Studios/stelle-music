import { Embed, createEvent } from "seyfert";

export default createEvent({
    data: { name: "guildCreate" },
    run: async (guild, client) => {
        if (guild.unavailable) return;

        const embed = new Embed()
            .setColor(client.config.color.success)
            .setTitle("A new guild added me!")
            .setDescription("`📦` A new guild has added me! I hope I can be helpful in this journey.")
            .addFields(
                { name: "`📜` Name", value: `\`${guild.name}\``, inline: true },
                { name: "`🏮` ID", value: `\`${guild.id}\``, inline: true },
                { name: "`👥` Members", value: `\`${guild.memberCount}\``, inline: true },
            );

        await client.messages.write(client.config.channels.guildsId, { embeds: [embed] });
    },
});
