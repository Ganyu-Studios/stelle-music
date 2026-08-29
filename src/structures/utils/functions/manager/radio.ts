import { type PlayerStructure, type QueryResult, SearchSources, SourceNames, type TrackStructure } from "hoshimi";
import type { TrackUser } from "#stelle/types";

/**
 * How a seeded mix's tracks are meant to be consumed.
 */
export enum MixKind {
    /**
     * A long, ordered YouTube "RD" playlist — take a random window so replays vary.
     */
    Radio = "radio",
    /**
     * An already-curated short list (Spotify mix / Deezer recommendations) — take it from the top.
     */
    List = "list",
}

/**
 * A batch of related tracks seeded from a single track, plus how it should be consumed.
 */
export interface Mix {
    /**
     * The related tracks (the seed itself excluded).
     * @type {TrackStructure[]}
     */
    tracks: TrackStructure[];
    /**
     * How the tracks should be consumed (see {@link MixKind}).
     * @type {MixKind}
     */
    kind: MixKind;
}

interface MixSearchOptions {
    /**
     * The player to search through.
     * @type {PlayerStructure}
     */
    player: PlayerStructure;
    /**
     * The query to search.
     * @type {string}
     */
    query: string;
    /**
     * The source to run the query on.
     * @type {SearchSources}
     */
    source: SearchSources;
    /**
     * The requester to attach to the tracks.
     * @type {TrackUser | null}
     */
    requester: TrackUser | null;
}

/**
 *
 * Run a search through the player and return just its tracks (empty on any failure).
 * @param {MixSearchOptions} options The search options.
 * @returns {Promise<TrackStructure[]>} The resulting tracks.
 */
async function search({ player, query, source, requester }: MixSearchOptions): Promise<TrackStructure[]> {
    const result: QueryResult | null = await player.search({ query, source, requester }).catch((): null => null);
    return result?.tracks ?? [];
}

/**
 *
 * Drop the seed itself from a batch of related tracks, so a mix never recommends the very track it grew from.
 * @param {TrackStructure[]} tracks The tracks to prune.
 * @param {string} identifier The seed identifier to exclude.
 * @returns {TrackStructure[]} The tracks without the seed.
 */
const exclude = (tracks: TrackStructure[], identifier: string): TrackStructure[] =>
    tracks.filter((track): boolean => track.info.identifier !== identifier);

/**
 *
 * Fetch a YouTube "RD" radio mix seeded from a video id.
 * @param {PlayerStructure} player The player to search through.
 * @param {string} videoId The YouTube video id to seed the radio from.
 * @param {TrackUser | null} requester The requester to attach to the tracks.
 * @returns {Promise<TrackStructure[]>} The radio tracks.
 */
function youtubeRadio(player: PlayerStructure, videoId: string, requester: TrackUser | null): Promise<TrackStructure[]> {
    return search({
        player,
        query: `https://www.youtube.com/watch?v=${videoId}&list=RD${videoId}`,
        source: SearchSources.YoutubeMusic,
        requester,
    });
}

/**
 *
 * Expand a single track into a mix of related tracks, picking the strategy from the seed's source: a Spotify track
 * mix, a YouTube "RD" radio, or Deezer recommendations. When the Spotify mix comes back empty it bridges to a
 * YouTube radio via a title/artist lookup; unsupported sources yield nothing. The seed itself is always excluded.
 *
 * Shared by autoplay (which filters against history and queues a slice) and the quiz pool builder.
 * @param {PlayerStructure} player The player to search through.
 * @param {TrackStructure} seed The track to seed the mix from.
 * @param {TrackUser | null} requester The requester to attach to the resulting tracks.
 * @returns {Promise<Mix>} The related tracks and how to consume them.
 */
export async function seedMix(player: PlayerStructure, seed: TrackStructure, requester: TrackUser | null): Promise<Mix> {
    const { identifier, sourceName, title, author } = seed.info;

    switch (sourceName) {
        case SourceNames.Spotify: {
            const filtered: TrackStructure[] = player.queue.history
                .filter(({ info }): boolean => info.sourceName === SourceNames.Spotify)
                .slice(0, 1);
            if (!filtered.length) filtered.push(seed);

            const ids: string[] = filtered.map(
                ({ info }): string => info.identifier ?? info.uri?.split("/").reverse()?.[0] ?? info.uri?.split("/").reverse()?.[1],
            );

            // Spotify recommendations first: try to get a batch of related tracks from the Spotify API.
            const recomms: TrackStructure[] = await search({
                player,
                requester,
                query: `seed_tracks=${ids.join(",")}`,
                source: SearchSources.SpotifyRecommendations,
            });

            if (recomms.length) return { tracks: exclude(recomms, identifier), kind: MixKind.List };

            // Spotify recommendations empty: try a Spotify track mix instead.
            const mix: TrackStructure[] = await search({
                player,
                requester,
                query: identifier,
                source: SearchSources.SpotifyTrackMix,
            });

            if (mix.length) return { tracks: exclude(mix, identifier), kind: MixKind.List };

            // Spotify mix empty: bridge to a YouTube radio via a title/artist lookup.
            const [match]: TrackStructure[] = await search({
                player,
                requester,
                query: `${title} by ${author}`,
                source: SearchSources.Youtube,
            });
            if (!match) return { tracks: [], kind: MixKind.Radio };

            const radio: TrackStructure[] = await youtubeRadio(player, match.info.identifier, requester);
            return { tracks: exclude(radio, match.info.identifier), kind: MixKind.Radio };
        }
        case SourceNames.Youtube:
        case SourceNames.YoutubeMusic: {
            const radio: TrackStructure[] = await youtubeRadio(player, identifier, requester);
            return { tracks: exclude(radio, identifier), kind: MixKind.Radio };
        }
        case SourceNames.Deezer: {
            const recommendations: TrackStructure[] = await search({
                player,
                requester,
                query: identifier,
                source: SearchSources.DeezerRecommendations,
            });

            return { tracks: exclude(recommendations, identifier), kind: MixKind.List };
        }
        default:
            return { tracks: [], kind: MixKind.List };
    }
}
