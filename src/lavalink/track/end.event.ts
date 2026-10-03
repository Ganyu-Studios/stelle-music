import { EventNames } from "hoshimi";
import { LogLevels } from "seyfert";
import { PlayerOps } from "#stelle/utils/functions/manager/player.js";
import { createLavalinkEvent } from "#stelle/utils/manager/events.js";

export default createLavalinkEvent({
    name: EventNames.TrackEnd,
    async run(client, player, track): Promise<void> {
        if (!player.textId) return;

        // Independent REST cleanups (the now-playing message and the lyrics message are different messages): run them
        // concurrently. The messageId delete stays after, since nowPlaying reads it.
        await Promise.all([PlayerOps.nowPlaying(client, player, player.textId), PlayerOps.lyrics(client, player, player.textId)]);
        await player.data.delete("messageId");

        client.debug(
            LogLevels.Debug,
            `[Lavalink] Track ended | guild: ${player.guildId} | title: ${track?.info?.title ?? "Unknown"} | author: ${track?.info?.author ?? "Unknown"}`,
        );
    },
});
