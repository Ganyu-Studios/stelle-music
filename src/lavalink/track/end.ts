import { EventNames } from "hoshimi";
import { StelleMeta } from "#stelle/utils/data/constants.js";
import { clearNowPlaying, clearPlayerLyrics } from "#stelle/utils/functions/manager/player.js";
import { createLavalinkEvent } from "#stelle/utils/manager/events.js";

export default createLavalinkEvent({
    name: EventNames.TrackEnd,
    async run(client, player, track): Promise<void> {
        if (!player.textId) return;

        await clearNowPlaying(client, player, player.textId);
        await clearPlayerLyrics(client, player, player.textId);
        await player.data.delete("messageId");

        if (StelleMeta.Debug)
            client.debugger?.info(
                `[Lavalink] Track ended | guild: ${player.guildId} | title: ${track?.info?.title ?? "Unknown"} | author: ${track?.info?.author ?? "Unknown"}`,
            );
    },
});
