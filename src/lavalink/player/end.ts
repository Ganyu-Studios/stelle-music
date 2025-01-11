import { Lavalink } from "#stelle/classes";

export default new Lavalink({
    name: "trackEnd",
    type: "manager",
    run: async (client, player) => {
        if (!player.textChannelId) {
            return;
        }

        const messageId = player.get<undefined | string>("messageId");
        if (!messageId) {
            return;
        }

        await client.messages.edit(messageId, player.textChannelId, { components: [] }).catch(() => null);
    }
});
