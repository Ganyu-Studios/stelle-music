import type { Player, Track, UnresolvedTrack } from "lavalink-client";
import type { ClientUserWithoutClient } from "#stelle/types";

type ResolvableTrack = UnresolvedTrack | Track;

const maxTracks = 10;

/**
 * Based on:
 * https://github.com/Tomato6966/lavalink-client/blob/main/testBot/Utils/OptionalFunctions.ts#L20
 *
 * Modified by: https://github.com/NoBody-UU/
 */

/**
 *
 * Filter tracks.
 * @param player The player.
 * @param lastTrack The last track.
 * @param tracks The tracks.
 * @returns {ResolvableTrack[]} The filtered tracks.
 */
const filterTracks = (player: Player, lastTrack: Track, tracks: ResolvableTrack[]) =>
    tracks.filter(
        (track) =>
            !(
                player.queue.previous.some((t) => t.info.identifier === track.info.identifier) ||
                lastTrack.info.identifier === track.info.identifier
            ),
    );

/**
 *
 * An autoplay function, that's all.
 * @param player The player.
 * @param lastTrack The last track.
 * @returns {Promise<void>} A promise... that does nothing.
 */
export async function autoPlayFunction(player: Player, lastTrack?: Track): Promise<void> {
    if (!lastTrack) return;
    if (!player.get("enabledAutoplay")) return;

    //c'mon dude, this shit seems to work, so
    if (!player.queue.previous.some((t) => t.info.identifier === lastTrack.info.identifier)) {
        player.queue.previous.unshift(lastTrack);
        await player.queue.utils.save();
    }

    const me = player.get<ClientUserWithoutClient | undefined>("me");
    if (!me) return;

    switch (lastTrack.info.sourceName) {
        case "spotify": {
            const filtered = player.queue.previous.filter(({ info }) => info.sourceName === "spotify").slice(0, 1);
            if (!filtered.length) filtered.push(lastTrack);

            const ids = filtered.map(
                ({ info }) => info.identifier ?? info.uri.split("/").reverse()?.[0] ?? info.uri.split("/").reverse()?.[1],
            );
            const res = await player.search({ query: `seed_tracks=${ids.join(",")}`, source: "sprec" }, me);

            if (res.tracks.length) {
                const track = filterTracks(player, lastTrack, res.tracks)[Math.floor(Math.random() * res.tracks.length)] as Track;
                await player.queue.add(track);
            }

            break;
        }

        case "youtube":
        case "youtubemusic": {
            const search = `https://www.youtube.com/watch?v=${lastTrack.info.identifier}&list=RD${lastTrack.info.identifier}`;
            const res = await player.search({ query: search }, me);

            if (res.tracks.length) {
                const random = Math.floor(Math.random() * res.tracks.length);
                const tracks = filterTracks(player, lastTrack, res.tracks).slice(random, random + maxTracks) as Track[];
                await player.queue.add(tracks);
            }

            break;
        }
    }
}
