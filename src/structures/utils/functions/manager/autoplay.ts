import type { Player, Track, UnresolvedTrack } from "lavalink-client";
import type { StelleUser } from "#stelle/types";

/**
 * The type of the resolvable tracks.
 */
type ResolvableTrack = UnresolvedTrack | Track;

/**
 * The maximum number of tracks to return.
 * @type {number}
 * @default 10
 */
const trackLimit: number = 10;

/**
 * Based on:
 * https://github.com/Tomato6966/lavalink-client/blob/main/testBot/Utils/OptionalFunctions.ts#L20
 *
 * A modified by: https://github.com/NoBody-UU/
 */

/**
 *
 * Filter tracks.
 * @param {Player} player The player instance.
 * @param {Track} lastTrack The last track played.
 * @param {ResolvableTrack[]}  tracks The tracks to filter.
 * @returns {ResolvableTrack[]} The filtered tracks.
 */
const filter = (player: Player, lastTrack: Track, tracks: ResolvableTrack[]): ResolvableTrack[] =>
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
 * @param player The player instance.
 * @param lastTrack The last track played.
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

    const me = player.get<StelleUser | undefined>("me");
    if (!me) return;

    switch (lastTrack.info.sourceName) {
        case "spotify": {
            const filtered = player.queue.previous.filter(({ info }) => info.sourceName === "spotify");
            const first = filtered.at(0);
            if (!first) return;

            const res = await player.search({ query: `mix:track:${first.info.identifier}`, source: "sprec" }, me);

            if (res.tracks.length) {
                const track = filter(player, lastTrack, res.tracks)[Math.floor(Math.random() * res.tracks.length)] as Track;
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
                const tracks = filter(player, lastTrack, res.tracks).slice(random, random + trackLimit) as Track[];
                await player.queue.add(tracks);
            }

            break;
        }
    }
}
