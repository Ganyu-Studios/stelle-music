import { Lavalink } from "#stelle/classes";

export default new Lavalink({
    name: "playerEnd",
    type: "kazagumo",
    run: async (client, player) => {
        if (!player.textId) return;

        const messageId = player.data.get("messageId") as string | undefined;
        if (!messageId) return;

        await client.messages.edit(messageId, player.textId, { components: [] });
    },
});
