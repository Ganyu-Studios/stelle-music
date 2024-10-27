import type { Player, SourceNames, Track, UnresolvedTrack } from "lavalink-client";
import type { CommandContext } from "seyfert";

type ResolvableTrack = UnresolvedTrack | Track;

const maxTracks = 10;

/**
 * Based on:
 * https://github.com/Tomato6966/lavalink-client/blob/main/testBot/Utils/OptionalFunctions.ts#L18
 *
 * Modified by: https://github.com/NoBody-UU/
 */

/**
 *
 * An autoplay function, that's all.
 * @param player The player.
 * @param lastTrack The last track.
 * @returns
 */
export async function autoPlayFunction(player: Player, lastTrack?: Track): Promise<void> {
    if (!lastTrack) return;
    if (!player.get("enabledAutoplay")) return;

    //c'mon dude, this shit seems to work, so
    if (!player.queue.previous.some((t) => t.info.identifier === lastTrack.info.identifier)) {
        player.queue.previous.unshift(lastTrack);
        await player.queue.utils.save();
    }

    const ctx = player.get<CommandContext | undefined>("commandContext");
    if (!ctx) return;

    const filterTracks = (tracks: ResolvableTrack[]) =>
        tracks.filter(
            (track) =>
                !(
                    player.queue.previous.some((t) => t.info.identifier === track.info.identifier) ||
                    lastTrack.info.identifier === track.info.identifier
                ),
        );

    const requester = {
        ...ctx.client.me,
        tag: ctx.client.me.username,
    };

    if (lastTrack.info.sourceName === "spotify") {
        const filtered = player.queue.previous.filter(({ info }) => info.sourceName === "spotify").slice(0, 1);
        if (!filtered.length) filtered.push(lastTrack);

        const ids = filtered.map(({ info }) => info.identifier ?? info.uri.split("/").reverse()?.[0] ?? info.uri.split("/").reverse()?.[1]);
        const res = await player.search({ query: `seed_tracks=${ids.join(",")}`, source: "sprec" }, requester);

        if (res.tracks.length) {
            const track = filterTracks(res.tracks)[Math.floor(Math.random() * res.tracks.length)] as Track;
            await player.queue.add(track);
        }
    } else if ((["youtube", "youtubemusic"] as SourceNames[]).includes(lastTrack.info.sourceName)) {
        const search = `https://www.youtube.com/watch?v=${lastTrack.info.identifier}&list=RD${lastTrack.info.identifier}`;
        const res = await player.search({ query: search }, requester);

        if (res.tracks.length) {
            const random = Math.floor(Math.random() * res.tracks.length);
            const tracks = filterTracks(res.tracks).slice(random, random + maxTracks) as Track[];
            await player.queue.add(tracks);
        }
    }
}
