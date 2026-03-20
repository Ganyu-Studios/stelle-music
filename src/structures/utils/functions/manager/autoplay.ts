import { type HoshimiTrack, type PlayerStructure, type QueryResult, SearchSources, SourceNames, type TrackStructure } from "hoshimi";
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
 * And also a modified version by: https://github.com/NoBody-UU/
 */

/**
 *
 * Filter tracks.
 * @param {Player} player The player instance.
 * @param {Track} lastTrack The last track played.
 * @param {HoshimiTrack[]}  tracks The tracks to filter.
 * @returns {HoshimiTrack[]} The filtered tracks.
 */
const filter = (player: PlayerStructure, lastTrack: TrackStructure, tracks: HoshimiTrack[]): HoshimiTrack[] =>
    tracks.filter(
        (track): boolean =>
            !(
                player.queue.history.some((t): boolean => t.info.identifier === track.info.identifier) ||
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

    const me: StelleUser | undefined = await player.data.get("me");
    if (!me) return;

    switch (lastTrack.info.sourceName) {
        case SourceNames.Spotify: {
            const search: QueryResult = await player.search({
                query: lastTrack.info.identifier,
                source: SearchSources.SpotifyTrackMix,
                requester: me,
            });

            // If we have results, add them to the queue
            if (search.tracks.length) {
                const tracks: HoshimiTrack[] = filter(player, lastTrack, search.tracks).slice(0, trackLimit);

                await player.queue.add(tracks);
                // If we don't have results, search on youtube
            } else {
                const search: QueryResult = await player.search({
                    source: SearchSources.Youtube,
                    query: `${lastTrack.info.title} ${lastTrack.info.author}`,
                    requester: me,
                });
                const tracks: HoshimiTrack[] = filter(player, lastTrack, search.tracks).slice(0, trackLimit);

                await player.queue.add(tracks);
            }

            break;
        }

        case SourceNames.Youtube:
        case SourceNames.YoutubeMusic: {
            const url = `https://www.youtube.com/watch?v=${lastTrack.info.identifier}&list=RD${lastTrack.info.identifier}`;
            const search: QueryResult = await player.search({ query: url, source: SearchSources.YoutubeMusic, requester: me });

            if (search.tracks.length) {
                const random: number = Math.floor(Math.random() * search.tracks.length);
                const tracks: HoshimiTrack[] = filter(player, lastTrack, search.tracks).slice(random, random + trackLimit);

                await player.queue.add(tracks);
            }

            break;
        }

        case SourceNames.Deezer: {
            const search: QueryResult = await player.search({
                query: lastTrack.info.identifier,
                source: SearchSources.DeezerRecommendations,
                requester: me,
            });
            const tracks: HoshimiTrack[] = filter(player, lastTrack, search.tracks).slice(0, trackLimit);

            await player.queue.add(tracks);

            break;
        }
    }
}
