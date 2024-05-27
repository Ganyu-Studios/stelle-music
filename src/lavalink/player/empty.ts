import { Lavalink } from "#stelle/classes";

export default new Lavalink({
    name: "playerEmpty",
    type: "kazagumo",
    run: async (client, player) => {
        if (!player.textId) return;

        const messageId = player.data.get("messageId") as string | undefined;
        if (!messageId) return;

        const message = await client.messages.fetch(messageId, player.textId);

        await message.edit({ components: [] });
    },
});
