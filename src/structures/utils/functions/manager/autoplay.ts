import type { PlayerStructure, TrackResolvableStructure, TrackStructure } from "hoshimi";
import type { TrackUser } from "#stelle/types";
import { type Mix, MixKind, seedMix } from "#stelle/utils/functions/manager/radio.js";

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

    const { tracks, kind }: Mix = await seedMix(player, lastTrack, me);

    const filtered: TrackResolvableStructure[] = filter(player, lastTrack, tracks);
    if (!filtered.length) return;

    // A YouTube radio is a long ordered list — pick a random window so replaying the same seed doesn't always
    // queue the same run of tracks. A curated mix (Spotify / Deezer) is short, so we just take it from the top.
    let start: number = 0;
    if (kind === MixKind.Radio) start = Math.max(0, Math.floor(Math.random() * (filtered.length - trackLimit + 1)));

    await player.queue.add(filtered.slice(start, start + trackLimit));
}
