import { EventNames } from "hoshimi";
import { StelleMeta } from "#stelle/utils/data/constants.js";
import { createLavalinkEvent } from "#stelle/utils/manager/events.js";

export default createLavalinkEvent({
    name: EventNames.TrackEnd,
    async run(client, player, track): Promise<void> {
        if (!player.textId) return;

        const messageId: string | undefined = await player.data.get("messageId");
        if (messageId) {
            if (client.config.deleter.onTrackEnd) await client.messages.delete(messageId, player.textId).catch((): null => null);
            else await client.messages.edit(messageId, player.textId, { components: [] }).catch((): null => null);
        }

        const lyricsId: string | undefined = await player.data.get("lyricsId");
        if (lyricsId) {
            await client.messages.delete(lyricsId, player.textId).catch((): null => null);

            await player.data.delete("lyricsId");
            await player.data.delete("lyrics");
        }

        await player.data.delete("messageId");

        if (StelleMeta.Debug)
            client.debugger?.info(
                `[Lavalink] Track ended | guild: ${player.guildId} | title: ${track?.info?.title ?? "Unknown"} | author: ${track?.info?.author ?? "Unknown"}`,
            );
    },
});
