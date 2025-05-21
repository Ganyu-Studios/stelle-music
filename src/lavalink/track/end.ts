import { LavalinkEventTypes } from "#stelle/types";
import { createLavalinkEvent } from "#stelle/utils/manager/events.js";

import { Constants } from "#stelle/utils/data/constants.js";

export default createLavalinkEvent({
    name: "trackEnd",
    type: LavalinkEventTypes.Manager,
    async run(client, player, track): Promise<void> {
        if (!player.textChannelId) return;

        const messageId = player.get<string | undefined>("messageId");
        if (messageId) await client.messages.edit(messageId, player.textChannelId, { components: [] }).catch(() => null);

        const lyricsId = player.get<string | undefined>("lyricsId");
        if (lyricsId) {
            await client.messages.delete(lyricsId, player.textChannelId).catch(() => null);

            player.set("lyricsId", undefined);
            player.set("lyrics", undefined);
            player.set("lyricsEnabled", undefined);
        }

        player.set("messageId", undefined);

        if (Constants.Debug) client.debugger?.info(`Player: ${player.guildId} | Track Ended: ${JSON.stringify(track)}`);
    },
});
