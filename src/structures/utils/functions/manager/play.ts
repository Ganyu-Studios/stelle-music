import { LoadType, type PlayerStructure, type QueryResult, type TrackStructure } from "hoshimi";
import type { AllGuildVoiceChannels, GuildMember, LocaleString, User, UsingClient } from "seyfert";
import { TrackOps } from "#stelle/utils/functions/internal/track.js";
import { joinVoiceChannel } from "#stelle/utils/functions/manager/voice.js";

/**
 * The inputs needed to resolve a query into a queued/playing track for a guild.
 */
export interface ResolveOptions {
    /** The client instance. */
    client: UsingClient;
    /** The guild id. */
    guildId: string;
    /** The target voice channel to join. */
    voice: AllGuildVoiceChannels;
    /** The bot's guild member (for the stage-suppress handling in joinVoiceChannel). */
    me: GuildMember;
    /** The text channel id the player should bind its now-playing messages to. */
    textId: string;
    /** The user that requested the track. */
    requester: User;
    /** The raw query (track name or URL). */
    query: string;
    /** The locale string to seed the player with (for out-of-context localization). */
    localeString: LocaleString;
    /** Whether this play originates from a request channel (drives the persistent panel). */
    isRequestChannel?: boolean;
}

/**
 * The result of {@link resolveAndQueue}: the player plus the raw search outcome, so each caller renders its own reply.
 */
export interface ResolveResult {
    /** The guild player. */
    player: PlayerStructure;
    /** The load type of the search. */
    loadType: LoadType;
    /** The playlist info, when the query resolved to a playlist. */
    playlist: QueryResult["playlist"];
    /** The resolved tracks. */
    tracks: TrackStructure[];
}

/**
 * The shared "create the player, join, search, enqueue and play" core used by both the `/play` command and the request
 * channel listener. It performs the player-side work only; the caller renders its own feedback from the result.
 * @param {ResolveOptions} options The resolution inputs.
 * @returns {Promise<ResolveResult>} The player and the raw search outcome.
 */
export async function resolveAndQueue(options: ResolveOptions): Promise<ResolveResult> {
    const { client, guildId, voice, me, textId, requester, query, localeString, isRequestChannel } = options;

    const { defaultVolume, searchPlatform } = await client.database.players.get(guildId);

    const player = client.manager.createPlayer({
        guildId,
        textId,
        voiceId: voice.id,
        volume: defaultVolume,
        selfDeaf: true,
    });

    await joinVoiceChannel(player, voice, me);

    const { loadType, playlist, tracks } = await player.search({ query, source: searchPlatform, requester });

    if (!(await player.data.get("localeString"))) await player.data.set("localeString", localeString);
    if (!(await player.data.get("me"))) await player.data.set("me", TrackOps.requesterFn(client.me));
    if (isRequestChannel) await player.data.set("isRequestChannel", true);

    const autoplayIndex: number | undefined = (await player.data.get("enabledAutoplay")) ? 0 : undefined;

    switch (loadType) {
        case LoadType.Track:
        case LoadType.Search: {
            const track: TrackStructure | undefined = tracks.at(0);
            if (track) {
                await player.queue.add(track, autoplayIndex);
                if (!player.playing) await player.play();
            }
            break;
        }
        case LoadType.Playlist: {
            if (tracks.length) {
                await player.queue.add(tracks, autoplayIndex);
                if (!player.playing) await player.play();
            }
            break;
        }
        default: {
            // Empty / Error / unknown: tear down a freshly-created idle player so we don't leave a ghost connection.
            if (!player.queue.current) await player.destroy();
            break;
        }
    }

    return { player, loadType, playlist, tracks };
}
