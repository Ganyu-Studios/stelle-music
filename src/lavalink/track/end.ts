import { LavalinkEventTypes } from "#stelle/types";
import { createLavalinkEvent } from "#stelle/utils/manager/events.js";

import type { LyricsResult } from "lavalink-client";

export default createLavalinkEvent({
    name: "trackEnd",
    type: LavalinkEventTypes.Manager,
    async run(client, player): Promise<void> {
        if (!player.textChannelId) return;

        const messageId = player.get<string | undefined>("messageId");
        if (messageId) await client.messages.edit(messageId, player.textChannelId, { components: [] }).catch(() => null);

        const lyricsId = player.get<string | undefined>("lyricsId");
        if (lyricsId) {
            await client.messages.delete(lyricsId, player.textChannelId).catch(() => null);

            if (player.get<boolean | undefined>("lyricsEnabled") && player.get<LyricsResult | undefined>("lyrics"))
                await player.node.lyrics.unsubscribe(player.guildId).catch(() => null);

            player.set("lyricsId", undefined);
            player.set("lyrics", undefined);
            player.set("lyricsEnabled", undefined);
        }

        player.set("messageId", undefined);
    },
});
