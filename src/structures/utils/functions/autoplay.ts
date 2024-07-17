import type { Player, Track } from "lavalink-client";
import type { CommandContext } from "seyfert";

/**
 * Based on:
 * https://github.com/Tomato6966/lavalink-client/blob/main/testBot/Utils/OptionalFunctions.ts#L18
 *
 * Modified by: https://github.com/NoBody-UU/
 */

/**
 *
 * An autoplay function, that's all.
 * @param player
 * @param lastTrack
 * @returns
 */
export async function autoPlayFunction(player: Player, lastTrack?: Track): Promise<void> {
    if (!lastTrack) return;
    if (!player.get("enabledAutoplay")) return;

    const maxTracks = 10;

    const ctx = player.get<CommandContext | undefined>("commandContext");
    if (!ctx) return;

    if (lastTrack.info.sourceName === "spotify") {
        const filtered = player.queue.previous.filter((track) => track.info.sourceName === "spotify").slice(0, 5);
        const ids = filtered.map(
            (track) => track.info.identifier || track.info.uri?.split("/")?.reverse()?.[0] || track.info.uri?.split("/")?.reverse()?.[1],
        );
        if (ids.length >= 1) {
            const res = await player.search(
                { query: `seed_tracks=${ids.join(",")}`, source: "sprec" },
                { ...ctx.client.me, tag: ctx.client.me.username },
            );
            const tracks = res.tracks.filter((v) => !player.queue.previous.find((t) => t.info.identifier === v.info.identifier));

            if (res.tracks.length) player.queue.add(tracks.slice(0, maxTracks));
        }
    } else if (["youtube", "youtubemusic"].includes(lastTrack.info.sourceName)) {
        const search = `https://www.youtube.com/watch?v=${lastTrack.info.identifier}&list=RD${lastTrack.info.identifier}`;
        const res = await player.search(search, { requester: { ...ctx.client.me, tag: ctx.client.me.username } });
        const tracks = res.tracks.filter((v) => !player.queue.previous.find((t) => t.info.identifier === v.info.identifier));

        if (res.tracks.length) player.queue.add(tracks.slice(0, maxTracks));
    }
}
