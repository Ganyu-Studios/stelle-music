import { LoadType, type PlayerStructure, type QueryResult, SearchSources, SourceNames, type TrackStructure } from "hoshimi";
import type { AllGuildVoiceChannels, DefaultLocale, GuildMember, LocaleString, UsingClient } from "seyfert";
import { ContextOps } from "#stelle/utils/functions/internal/context.js";
import { matches } from "#stelle/utils/functions/internal/quiz.js";
import { TrackOps } from "#stelle/utils/functions/internal/track.js";
import { UtilsOps } from "#stelle/utils/functions/internal/utils.js";
import { joinVoiceChannel } from "#stelle/utils/functions/manager/voice.js";

/**
 * The messages tree of a resolved locale.
 */
type Messages = DefaultLocale["messages"];

/**
 * How long the reveal stays up before the next round starts. (In milliseconds)
 * @type {number}
 */
const INTER_ROUND_DELAY: number = 4000;

/**
 * A single quiz round: the track to guess and who (if anyone) has already claimed its title / artist.
 */
interface QuizRound {
    /**
     * The track being guessed this round.
     * @type {TrackStructure}
     */
    track: TrackStructure;
    /**
     * The id of the user who guessed the title, or null if still unclaimed.
     * @type {string | null}
     */
    titleBy: string | null;
    /**
     * The id of the user who guessed the artist, or null if still unclaimed.
     * @type {string | null}
     */
    artistBy: string | null;
}

/**
 * The in-memory state of a guild's running quiz. Ephemeral by design — a game does not survive a restart.
 */
interface QuizSession {
    /**
     * The guild the game is running in.
     * @type {string}
     */
    guildId: string;
    /**
     * The text channel the game reads guesses from and posts to.
     * @type {string}
     */
    channelId: string;
    /**
     * The hidden (`isQuiz`) player the snippets play through.
     * @type {PlayerStructure}
     */
    player: PlayerStructure;
    /**
     * The shuffled tracks for this game, one per round.
     * @type {TrackStructure[]}
     */
    pool: TrackStructure[];
    /**
     * The number of rounds the game runs for.
     * @type {number}
     */
    total: number;
    /**
     * The current round number (1-based); 0 before the first round starts.
     * @type {number}
     */
    index: number;
    /**
     * The running score per user id.
     * @type {Map<string, number>}
     */
    scores: Map<string, number>;
    /**
     * The active round, or null between rounds / after the game ends.
     * @type {QuizRound | null}
     */
    current: QuizRound | null;
    /**
     * The armed snippet timer that ends the current round on timeout, or null when none is pending.
     * @type {NodeJS.Timeout | null}
     */
    timer: NodeJS.Timeout | null;
}

/**
 * The inputs needed to start a quiz in a guild.
 */
export interface StartQuizOptions {
    /**
     * The client instance.
     * @type {UsingClient}
     */
    client: UsingClient;
    /**
     * The guild to start the game in.
     * @type {string}
     */
    guildId: string;
    /**
     * The text channel the game reads guesses from and posts to.
     * @type {string}
     */
    channelId: string;
    /**
     * The voice channel the hidden player joins to play the snippets.
     * @type {AllGuildVoiceChannels}
     */
    voice: AllGuildVoiceChannels;
    /**
     * The bot's member object in the guild, used to join the voice channel.
     * @type {GuildMember}
     */
    me: GuildMember;
    /**
     * The number of rounds to play. Falls back to `config.quiz.rounds` when omitted.
     * @type {number | undefined}
     */
    rounds?: number;
    /**
     * The locale string used for the game's messages.
     * @type {LocaleString}
     */
    localeString: LocaleString;
}

/**
 * The outcome of {@link QuizOps.start}: either the started game's round count, or why it couldn't start.
 */
export type StartQuizResult = { ok: true; rounds: number } | { ok: false; reason: "alreadyRunning" | "busy" | "notEnoughTracks" };

/**
 * The running quiz per guild id. In-memory only, mirroring the ephemeral nature of a game.
 * @type {Map<string, QuizSession>}
 */
const sessions: Map<string, QuizSession> = new Map();

/**
 *
 * Post a plain message to the quiz channel, swallowing any failure (a game shouldn't die on a transient send error).
 * @param {UsingClient} client The client instance.
 * @param {string} channelId The channel id.
 * @param {string} content The message content.
 * @returns {Promise<void>} A promise that resolves once the message is sent (or the failure is swallowed).
 */
async function say(client: UsingClient, channelId: string, content: string): Promise<void> {
    await client.messages.write(channelId, { content }).catch((): null => null);
}

/**
 * A resolved mix search: the query to run and the source to run it on.
 */
interface MixQuery {
    /**
     * The query to search (a track identifier or a radio URL).
     * @type {string}
     */
    query: string;
    /**
     * The source to run the query on.
     * @type {SearchSources}
     */
    source: SearchSources;
}

/**
 *
 * Expand a single track into a mix of related tracks, picking the strategy from the seed's source (Spotify mix,
 * YouTube "RD" radio, or Deezer recommendations). Unsupported sources yield nothing, so the seed stands alone.
 * @param {PlayerStructure} player The player to search through.
 * @param {TrackStructure} seed The track to seed the mix from.
 * @returns {Promise<TrackStructure[]>} The related tracks (excluding the seed).
 */
async function seedMix(player: PlayerStructure, seed: TrackStructure): Promise<TrackStructure[]> {
    const { identifier, sourceName } = seed.info;

    const query: MixQuery | null = ((): MixQuery | null => {
        switch (sourceName) {
            case SourceNames.Spotify:
                return { query: identifier, source: SearchSources.SpotifyTrackMix };
            case SourceNames.Youtube:
            case SourceNames.YoutubeMusic:
                return { query: `https://www.youtube.com/watch?v=${identifier}&list=RD${identifier}`, source: SearchSources.YoutubeMusic };
            case SourceNames.Deezer:
                return { query: identifier, source: SearchSources.DeezerRecommendations };
            default:
                return null;
        }
    })();

    if (!query) return [];

    const mix: QueryResult | null = await player.search({ ...query, requester: null }).catch((): null => null);
    return mix?.tracks ?? [];
}

/**
 *
 * Resolve a single `quiz.sources` entry into its tracks. A playlist contributes all of its tracks; anything that
 * resolves to a single track (a track URL or a plain query's top hit) is expanded into a pool via a source-aware
 * mix (see {@link seedMix}), so one song still yields a full game.
 * @param {PlayerStructure} player The player to search through.
 * @param {string} entry The source entry (URL or search query).
 * @param {SearchSources} searchSource The platform to search plain queries on.
 * @returns {Promise<TrackStructure[]>} The tracks contributed by this entry.
 */
async function resolveSource(player: PlayerStructure, entry: string, searchSource: SearchSources): Promise<TrackStructure[]> {
    const result: QueryResult | null = await player.search({ query: entry, source: searchSource, requester: null }).catch((): null => null);
    if (!result?.tracks.length) return [];

    if (result.loadType === LoadType.Playlist) return result.tracks;

    const seed: TrackStructure = result.tracks[0];
    return [seed, ...(await seedMix(player, seed))];
}

/**
 *
 * Resolve the configured `quiz.sources` entries into a shuffled, de-duplicated pool of tracks, searched through
 * the game's player (see {@link resolveSource} for how each entry contributes).
 * @param {UsingClient} client The client instance.
 * @param {PlayerStructure} player The player to search through.
 * @returns {Promise<TrackStructure[]>} The shuffled track pool.
 */
async function buildPool(client: UsingClient, player: PlayerStructure): Promise<TrackStructure[]> {
    const { sources } = client.config.quiz;
    const searchSource = client.config.defaultSearchSource;

    const results: TrackStructure[][] = await Promise.all(
        sources.map((entry): Promise<TrackStructure[]> => resolveSource(player, entry, searchSource)),
    );

    const seen: Set<string> = new Set();
    const pool: TrackStructure[] = results.flat().filter((track): boolean => {
        if (seen.has(track.info.identifier)) return false;
        seen.add(track.info.identifier);
        return true;
    });

    // Fisher-Yates shuffle so each game draws a different order from the pool.
    for (let i: number = pool.length - 1; i > 0; i--) {
        const j: number = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    client.debug(`[Quiz] Pool built | sources: ${sources.length} | unique tracks: ${pool.length}`);

    return pool;
}

/**
 *
 * Advance to the next round (or end the game when the pool is exhausted): announce it, play the track, and arm
 * the snippet timer that ends the round on timeout.
 * @param {UsingClient} client The client instance.
 * @param {QuizSession} session The running session.
 * @returns {Promise<void>} A promise that resolves once the round is set up (or the game ended).
 */
async function nextRound(client: UsingClient, session: QuizSession): Promise<void> {
    session.index++;
    if (session.index > session.total) return endGame(client, session);

    const track: TrackStructure = session.pool[session.index - 1];
    session.current = { track, titleBy: null, artistBy: null };

    const { messages } = await ContextOps.locale(client, session.guildId);
    await say(client, session.channelId, messages.events.quiz.roundStart({ round: session.index, total: session.total }));

    await session.player.play({ track }).catch((): null => null);

    session.timer = setTimeout((): void => {
        void endRound(client, session, "timeout");
    }, client.config.quiz.snippet);
}

/**
 *
 * End the current round: cancel the snippet timer, reveal the answer, and (after a short pause) advance. Guards
 * against double-invocation by clearing `current` up front, so a late guess and the timer can't both fire it.
 * @param {UsingClient} client The client instance.
 * @param {QuizSession} session The running session.
 * @param {"solved" | "timeout"} reason Why the round ended.
 * @returns {Promise<void>} A promise that resolves once the next round (or the game end) is scheduled.
 */
async function endRound(client: UsingClient, session: QuizSession, reason: "solved" | "timeout"): Promise<void> {
    if (session.timer) {
        clearTimeout(session.timer);
        session.timer = null;
    }

    const round: QuizRound | null = session.current;
    if (!round) return;

    session.current = null;

    const { messages } = await ContextOps.locale(client, session.guildId);

    if (reason === "timeout") await say(client, session.channelId, messages.events.quiz.timeout);
    await say(client, session.channelId, messages.events.quiz.reveal({ title: round.track.info.title, artist: round.track.info.author }));

    await UtilsOps.wait(INTER_ROUND_DELAY);

    // The game may have been stopped (or replaced) during the pause; only continue if this session is still live.
    if (sessions.get(session.guildId) !== session) return;

    await nextRound(client, session);
}

/**
 *
 * End the game: drop the session, post the final leaderboard, and tear down the player.
 * @param {UsingClient} client The client instance.
 * @param {QuizSession} session The running session.
 * @returns {Promise<void>} A promise that resolves once the game is finished.
 */
async function endGame(client: UsingClient, session: QuizSession): Promise<void> {
    if (session.timer) clearTimeout(session.timer);
    sessions.delete(session.guildId);

    const { messages } = await ContextOps.locale(client, session.guildId);
    await say(client, session.channelId, QuizOps.leaderboard(messages, session.scores));

    await session.player.destroy().catch((): null => null);
}

export const QuizOps = {
    /**
     *
     * Get the running quiz session for a guild, if any. Used by the message listener to route guesses.
     * @param {string} guildId The guild id.
     * @returns {QuizSession | undefined} The running session, or undefined.
     */
    get(guildId: string): QuizSession | undefined {
        return sessions.get(guildId);
    },
    /**
     *
     * Render the scoreboard from a scores map: the ranked leaderboard, or the "nobody scored" line when empty.
     * Shared by the game-over summary and the `/quiz leaderboard` subcommand.
     * @param {Messages} messages The resolved locale messages.
     * @param {Map<string, number>} scores The user id -> points map.
     * @returns {string} The rendered scoreboard.
     */
    leaderboard(messages: Messages, scores: Map<string, number>): string {
        const ranked: Array<[string, number]> = [...scores.entries()].sort((a, b): number => b[1] - a[1]);
        if (!ranked.length) return messages.events.quiz.noScores;

        const lines: string[] = ranked.map(([user, points], index): string =>
            messages.events.quiz.leaderboard.entry({ position: index + 1, user, points }),
        );

        return `${messages.events.quiz.leaderboard.title}\n${lines.join("\n")}`;
    },
    /**
     *
     * Start a quiz in a guild: gather the pool, spin up a hidden (`isQuiz`) player, join voice, and kick off round 1.
     * @param {StartQuizOptions} options The start inputs.
     * @returns {Promise<StartQuizResult>} The started round count, or the reason it couldn't start.
     */
    async start(options: StartQuizOptions): Promise<StartQuizResult> {
        const { client, guildId, channelId, voice, me, rounds, localeString } = options;

        if (sessions.has(guildId)) return { ok: false, reason: "alreadyRunning" };
        // A regular player is already busy in this guild; don't hijack an ongoing session with a quiz.
        if (client.manager.getPlayer(guildId)) return { ok: false, reason: "busy" };

        const { defaultVolume } = await client.database.players.get(guildId);

        const player = client.manager.createPlayer({
            guildId,
            textId: channelId,
            voiceId: voice.id,
            volume: defaultVolume,
            selfDeaf: true,
        });

        // Build the pool through the player's node (mix sources resolve the same way autoplay's do); voice is only
        // joined once we know there are enough tracks, so a failed pool doesn't leave the bot idling in the channel.
        const pool: TrackStructure[] = await buildPool(client, player);
        const total: number = Math.min(rounds ?? client.config.quiz.rounds, pool.length);
        if (total < 1) {
            await player.destroy().catch((): null => null);
            return { ok: false, reason: "notEnoughTracks" };
        }

        await joinVoiceChannel(player, voice, me);
        await player.data.set("isQuiz", true);
        await player.data.set("localeString", localeString);
        await player.data.set("me", TrackOps.requesterFn(client.me));

        const session: QuizSession = {
            guildId,
            channelId,
            player,
            pool: pool.slice(0, total),
            total,
            index: 0,
            scores: new Map(),
            current: null,
            timer: null,
        };

        sessions.set(guildId, session);

        await nextRound(client, session);

        return { ok: true, rounds: total };
    },
    /**
     *
     * Handle a chat guess for the current round. Awards a point for a newly-claimed title or artist, announces it,
     * and ends the round early once both have been claimed. No-op when there's no active round.
     * @param {UsingClient} client The client instance.
     * @param {QuizSession} session The running session.
     * @param {string} userId The guesser's user id.
     * @param {string} content The raw message content.
     * @returns {Promise<void>} A promise that resolves once the guess is processed.
     */
    async guess(client: UsingClient, session: QuizSession, userId: string, content: string): Promise<void> {
        const round: QuizRound | null = session.current;
        if (!round) return;

        const { messages } = await ContextOps.locale(client, session.guildId);

        const award = (): void => {
            session.scores.set(userId, (session.scores.get(userId) ?? 0) + 1);
        };

        if (!round.titleBy && matches(content, round.track.info.title)) {
            round.titleBy = userId;
            award();
            await say(client, session.channelId, messages.events.quiz.guessed.title({ user: userId }));
        }

        if (!round.artistBy && matches(content, round.track.info.author)) {
            round.artistBy = userId;
            award();
            await say(client, session.channelId, messages.events.quiz.guessed.artist({ user: userId }));
        }

        if (round.titleBy && round.artistBy) await endRound(client, session, "solved");
    },
    /**
     *
     * Stop a running quiz on request: cancel its timer, drop the session, and tear down the player.
     * @param {string} guildId The guild id.
     * @returns {Promise<boolean>} True if a quiz was running and got stopped, false if there was none.
     */
    async stop(guildId: string): Promise<boolean> {
        const session: QuizSession | undefined = sessions.get(guildId);
        if (!session) return false;

        if (session.timer) clearTimeout(session.timer);
        sessions.delete(guildId);

        await session.player.destroy().catch((): null => null);

        return true;
    },
};
