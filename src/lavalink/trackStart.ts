import { Lavalink } from "#stelle/classes";

export default new Lavalink({
    name: "playerStart",
    type: "kazagumo",
    run: async (client, player, track) => {
        const channel = await client.channels.fetch(player.textId!);
        if (!channel.isTextGuild()) return;

        await channel.messages.write({ content: `Now playing: ${track.title}` });
    },
});
