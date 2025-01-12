import { Lavalink } from "#stelle/classes";

export default new Lavalink({
    name: "trackEnd",
    type: "manager",
    async run(client, player): Promise<void> {
        if (!player.textChannelId) return;

        const messageId = player.get<string | undefined>("messageId");
        if (!messageId) return;

        await client.messages.edit(messageId, player.textChannelId, { components: [] }).catch(() => null);
    },
});
