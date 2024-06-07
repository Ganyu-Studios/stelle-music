import type { KazagumoPlayer, KazagumoTrack } from "kazagumo";

/**
 * Based on:
 * https://github.com/Tomato6966/lavalink-client/blob/main/testBot/Utils/OptionalFunctions.ts#L18
 *
 * Modified by: https://github.com/NoBody-UU/
 * Adapted to shoukaku/kazagumo: Me lol
 */

/**
 *
 * An autoplay function, that's all.
 * @param player
 * @param lastTrack
 * @returns
 */
export async function autoplay(player: KazagumoPlayer, lastTrack?: KazagumoTrack): Promise<void> {
    if (!lastTrack) return;
    if (!player.data.get("enabledAutoplay")) return;

    const maxTracks = 10;

    if (lastTrack.sourceName === "spotify") {
        const filtered = player.queue.previous.filter((track) => track.sourceName === "spotify").slice(0, 5);
        const ids = filtered.map(
            (track) => track.identifier || track.uri?.split("/")?.reverse()?.[0] || track.uri?.split("/")?.reverse()?.[1],
        );
        if (ids.length >= 1) {
            const res = await player.search(`seed_tracks=${ids.join(",")}`, { requester: lastTrack.requester, source: "sprec:" });
            const tracks = res.tracks.filter((v) => !player.queue.previous.find((t) => t.identifier === v.identifier));

            if (res.tracks.length) player.queue.add(tracks.slice(0, maxTracks));
        }
    } else if (["youtube", "youtubemusic"].includes(lastTrack.sourceName)) {
        const search = `https://www.youtube.com/watch?v=${lastTrack.identifier}&list=RD${lastTrack.identifier}`;
        const res = await player.search(search, { requester: lastTrack.requester });
        const tracks = res.tracks.filter((v) => !player.queue.previous.find((t) => t.identifier === v.identifier));

        if (res.tracks.length) player.queue.add(tracks.slice(0, maxTracks));
    }

    //just in case
    if (!player.playing) await player.play();
}
