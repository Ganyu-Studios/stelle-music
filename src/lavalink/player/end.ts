import { Lavalink } from "#stelle/classes";

export default new Lavalink({
    name: "trackEnd",
    type: "manager",
    async run(client, player): Promise<void> {
        if (!player.textChannelId) return;

        const messageId = player.get<string | undefined>("messageId");
        if (messageId) await client.messages.edit(messageId, player.textChannelId, { components: [] }).catch(() => null);

        const lyricsId = player.get<string | undefined>("lyricsId");
        if (lyricsId) {
            await client.messages.delete(lyricsId, player.textChannelId).catch(() => null);
            await player.node.request(`/sessions/${player.node.sessionId}/players/${player.guildId}/unsubscribe`).catch(() => null);

            player.set("lyricsId", undefined);
            player.set("lyrics", undefined);
        }
    },
});
