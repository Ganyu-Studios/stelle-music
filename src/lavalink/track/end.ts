import { LavalinkEventTypes } from "#stelle/types";
import { Constants } from "#stelle/utils/data/constants.js";
import { createLavalinkEvent } from "#stelle/utils/manager/events.js";

export default createLavalinkEvent({
    name: "trackEnd",
    type: LavalinkEventTypes.Manager,
    async run(client, player, track): Promise<void> {
        if (!player.textChannelId) return;

        const messageId = player.get<string | undefined>("messageId");
        if (messageId) {
            if (client.config.deleter.onTrackEnd) await client.messages.delete(messageId, player.textChannelId).catch((): null => null);
            else await client.messages.edit(messageId, player.textChannelId, { components: [] }).catch((): null => null);
        }

        const lyricsId = player.get<string | undefined>("lyricsId");
        if (lyricsId) {
            await client.messages.delete(lyricsId, player.textChannelId).catch((): null => null);

            player.set("lyricsId", undefined);
            player.set("lyrics", undefined);
        }

        player.set("messageId", undefined);

        if (Constants.Debug) client.debugger?.info(`[Player ${player.guildId}] Track Ended: ${JSON.stringify(track)}`);
    },
});
