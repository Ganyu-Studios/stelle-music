import {
    type PlayerStructure,
    type QueryResult,
    SearchSources,
    SourceNames,
    type TrackResolvableStructure,
    type TrackStructure,
} from "hoshimi";
import type { TrackUser } from "#stelle/types";

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
 * @param {TrackResolvableStructure[]}  tracks The tracks to filter.
 * @returns {TrackResolvableStructure[]} The filtered tracks.
 */
const filter = (player: PlayerStructure, lastTrack: TrackStructure, tracks: TrackResolvableStructure[]): TrackResolvableStructure[] =>
    tracks.filter(
        (track): boolean =>
            !(
                player.queue.history.some((t): boolean => t.info.identifier === track.info.identifier) ||
                lastTrack.info.identifier === track.info.identifier
            ),
    );

/**
 *
 * Seed a YouTube "RD" radio mix from a video id and queue a slice of it. Shared by the YouTube / YouTube Music
 * branch and the Spotify fallback (once it has bridged the Spotify track to a YouTube video).
 * @param {PlayerStructure} player The player instance.
 * @param {string} videoId The YouTube video id to seed the radio from.
 * @param {TrackStructure} seed The track filtered out of the results (the radio seed itself).
 * @param {TrackUser} me The requester.
 * @returns {Promise<void>} A promise that resolves once the radio tracks are queued.
 */
async function startRadio(player: PlayerStructure, videoId: string, seed: TrackStructure, me: TrackUser): Promise<void> {
    const url: string = `https://www.youtube.com/watch?v=${videoId}&list=RD${videoId}`;
    const query: QueryResult = await player.search({ query: url, source: SearchSources.YoutubeMusic, requester: me });

    const tracks: TrackResolvableStructure[] = filter(player, seed, query.tracks);
    if (!tracks.length) return;

    // Pick a random window so replaying the same seed doesn't always queue the same run of tracks.
    const start: number = Math.max(0, Math.floor(Math.random() * (tracks.length - trackLimit + 1)));
    await player.queue.add(tracks.slice(start, start + trackLimit));
}

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

    const me: TrackUser | undefined = await player.data.get("me");
    if (!me) return;

    switch (lastTrack.info.sourceName) {
        case SourceNames.Spotify: {
            const { tracks }: QueryResult = await player.search({
                query: lastTrack.info.identifier,
                source: SearchSources.SpotifyTrackMix,
                requester: me,
            });

            // Spotify gave us a mix: queue it directly.
            if (tracks.length) {
                await player.queue.add(filter(player, lastTrack, tracks).slice(0, trackLimit));
                break;
            }

            // No mix available: bridge the Spotify track to a YouTube video, then seed a radio from it.
            const query: QueryResult = await player.search({
                source: SearchSources.Youtube,
                query: `${lastTrack.info.title} ${lastTrack.info.author}`,
                requester: me,
            });

            const match: TrackStructure | undefined = query.tracks.at(0);
            if (match) await startRadio(player, match.info.identifier, match, me);

            break;
        }

        case SourceNames.Youtube:
        case SourceNames.YoutubeMusic: {
            await startRadio(player, lastTrack.info.identifier, lastTrack, me);

            break;
        }

        case SourceNames.Deezer: {
            const query: QueryResult = await player.search({
                query: lastTrack.info.identifier,
                source: SearchSources.DeezerRecommendations,
                requester: me,
            });

            const tracks: TrackResolvableStructure[] = filter(player, lastTrack, query.tracks).slice(0, trackLimit);

            await player.queue.add(tracks);

            break;
        }
    }
}
