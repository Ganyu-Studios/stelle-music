import { type HoshimiTrack, type PlayerStructure, type QueryResult, SearchEngines, type TrackStructure } from "hoshimi";
import type { StelleUser } from "#stelle/types";

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
const filter = (player: PlayerStructure, lastTrack: TrackStructure, tracks: HoshimiTrack[]): HoshimiTrack[] =>
    tracks.filter(
        (track): boolean =>
            !(
                player.queue.history.some((t) => t.info.identifier === track.info.identifier) ||
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
export async function autoplayFn(player: PlayerStructure, lastTrack: TrackStructure | null): Promise<void> {
    if (!lastTrack) return;

    if (!(await player.data.get("enabledAutoplay"))) return;

    //c'mon dude, this shit seems to work, so
    if (!player.queue.history.some((t): boolean => t.info.identifier === lastTrack.info.identifier)) {
        player.queue.history.unshift(lastTrack);
        await player.queue.utils.save();
    }

    const me: StelleUser | undefined = await player.data.get("me");
    if (!me) return;

    switch (lastTrack.info.sourceName) {
        case "spotify": {
            const filtered: TrackStructure[] = player.queue.history.filter(({ info }): boolean => info.sourceName === "spotify");
            const first: TrackStructure | undefined = filtered.at(0);
            if (!first) return;

            const res: QueryResult = await player.search({
                query: first.info.identifier,
                engine: SearchEngines.SpotifyTrackMix,
                requester: me,
            });

            if (res.tracks.length) {
                const track: HoshimiTrack = filter(player, lastTrack, res.tracks)[Math.floor(Math.random() * res.tracks.length)];
                await player.queue.add(track);
            }

            break;
        }

        case "youtube":
        case "youtubemusic": {
            const search = `https://www.youtube.com/watch?v=${lastTrack.info.identifier}&list=RD${lastTrack.info.identifier}`;
            const res: QueryResult = await player.search({ query: search, engine: SearchEngines.YoutubeMusic, requester: me });

            if (res.tracks.length) {
                const random: number = Math.floor(Math.random() * res.tracks.length);
                const tracks: HoshimiTrack[] = filter(player, lastTrack, res.tracks).slice(random, random + trackLimit);

                await player.queue.add(tracks);
            }

            break;
        }
    }
}
