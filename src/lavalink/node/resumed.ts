import { Lavalink } from "#stelle/classes";

export default new Lavalink({
    name: "resumed",
    type: "node",
    run: async (client, _node, _payload, players) => {
        for await (const player of players) {
            const member = await client.members.fetch(player.guildId, client.me.id);
            const voice = member.voice();
            if (!voice?.channelId) continue;

            const newPlayer =
                client.manager.getPlayer(player.guildId) ??
                client.manager.createPlayer({
                    guildId: player.guildId,
                    volume: player.volume,
                    voiceChannelId: voice.channelId,
                });

            await newPlayer.queue.utils.sync();
        }
    },
});
