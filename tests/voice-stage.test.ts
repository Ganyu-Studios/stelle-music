import assert from "node:assert/strict";
import { test } from "node:test";

const { playerListener } = await import("#stelle/utils/listeners/player/playerListener.js");
const { joinVoiceChannel, releaseUnsuppress } = await import("#stelle/utils/functions/manager/voice.js");

/**
 * A fake player with a Map-backed `data` store (the subset of hoshimi's PlayerMemoryStorage the stage code uses).
 */
interface FakePlayer {
    guildId: string;
    connected: boolean;
    textId: null;
    voiceId: null;
    connects: number;
    connect: () => Promise<void>;
    data: {
        store: Map<string, unknown>;
        get: (key: string) => unknown;
        set: (key: string, value: unknown) => void;
        delete: (key: string) => boolean;
    };
}

/**
 * Build a fake player.
 * @param {boolean} connected Whether the player reports itself connected.
 * @returns {FakePlayer} The fake player.
 */
function fakePlayer(connected: boolean): FakePlayer {
    const store: Map<string, unknown> = new Map();
    const player: FakePlayer = {
        guildId: "guild-1",
        connected,
        textId: null,
        voiceId: null,
        connects: 0,
        connect: (): Promise<void> => {
            player.connects++;
            player.connected = true;
            return Promise.resolve();
        },
        data: {
            store,
            get: (key: string): unknown => store.get(key),
            set: (key: string, value: unknown): void => void store.set(key, value),
            delete: (key: string): boolean => store.delete(key),
        },
    };

    return player;
}

/**
 * Inputs for a single `playerListener` run with the minimal fakes it touches on the bot's own voice-state path.
 */
interface HarnessOptions {
    /**
     * The id the fake client reports as its own.
     * @type {string}
     * @default "bot-1"
     */
    botId?: string;
    /**
     * The user the voice state belongs to.
     * @type {string}
     * @default botId
     */
    userId?: string;
    /**
     * The channel the user moved to. `null` simulates a voice leave.
     * @type {string | null}
     * @default "stage-1"
     */
    channelId?: string | null;
    /**
     * The channel the user came from.
     * @type {string | null}
     * @default null
     */
    oldChannelId?: string | null;
    /**
     * Whether Discord reports the user as suppressed (audience).
     * @type {boolean}
     * @default true
     */
    suppress?: boolean;
    /**
     * Whether the target channel is a stage channel.
     * @type {boolean}
     * @default true
     */
    isStage?: boolean;
    /**
     * Whether the channel fetch rejects (e.g. the channel was deleted mid-event).
     * @type {boolean}
     * @default false
     */
    channelFails?: boolean;
    /**
     * Whether the fake player reports itself connected.
     * @type {boolean}
     * @default true
     */
    connected?: boolean;
    /**
     * Whether a player exists at all for the guild.
     * @type {boolean}
     * @default true
     */
    hasPlayer?: boolean;
}

/**
 * Run `playerListener` against fakes. The fake player has no text channel, so the listener stops right after the
 * stage handling and never reaches the empty-channel logic or the Lavalink node.
 * @param {HarnessOptions} options The harness inputs.
 * @returns {Promise<{ applied: boolean[]; pending: unknown }>} The `suppress` values the listener tried to apply, and
 * whether it left an unsuppress pending on the player.
 */
async function runListener(options: HarnessOptions = {}): Promise<{ applied: boolean[]; pending: unknown }> {
    const {
        botId = "bot-1",
        userId = botId,
        channelId = "stage-1",
        oldChannelId = null,
        suppress = true,
        isStage = true,
        channelFails = false,
        connected = true,
        hasPlayer = true,
    } = options;

    const applied: boolean[] = [];
    const player: FakePlayer = fakePlayer(connected);

    const client = {
        botId,
        debug: (): void => {},
        manager: {
            getPlayer: (): FakePlayer | undefined => (hasPlayer ? player : undefined),
        },
    };

    const newState = {
        userId,
        guildId: "guild-1",
        channelId,
        suppress,
        channel: (): Promise<{ isStage: () => boolean }> =>
            channelFails ? Promise.reject(new Error("unknown channel")) : Promise.resolve({ isStage: (): boolean => isStage }),
        setSuppress: (value: boolean): Promise<void> => {
            applied.push(value);
            return Promise.resolve();
        },
    };

    const oldState = { channelId: oldChannelId };

    await playerListener(...([client, newState, oldState] as unknown as Parameters<typeof playerListener>));

    return { applied, pending: player.data.store.get("pendingUnsuppress") };
}

test("stage: defers the unsuppress when the bot lands in a stage channel", async (): Promise<void> => {
    // Raising it here would race the node's voice handshake; the player update event raises it instead.
    assert.deepEqual(await runListener(), { applied: [], pending: true });
});

test("stage: defers even while the node is still connecting", async (): Promise<void> => {
    assert.deepEqual(await runListener({ connected: false }), { applied: [], pending: true });
});

test("stage: leaves a bot that lands unsuppressed alone", async (): Promise<void> => {
    assert.deepEqual(await runListener({ suppress: false }), { applied: [], pending: undefined });
});

test("stage: ignores regular voice channels", async (): Promise<void> => {
    assert.deepEqual(await runListener({ isStage: false }), { applied: [], pending: undefined });
});

test("stage: ignores other members joining the stage", async (): Promise<void> => {
    assert.deepEqual(await runListener({ userId: "human-1" }), { applied: [], pending: undefined });
});

test("stage: ignores the bot while the guild has no player", async (): Promise<void> => {
    assert.deepEqual(await runListener({ hasPlayer: false }), { applied: [], pending: undefined });
});

test("stage: ignores the bot leaving voice", async (): Promise<void> => {
    assert.deepEqual(await runListener({ channelId: null, oldChannelId: "stage-1" }), { applied: [], pending: undefined });
});

test("stage: respects an in-place suppression (moderator action)", async (): Promise<void> => {
    assert.deepEqual(await runListener({ channelId: "stage-1", oldChannelId: "stage-1" }), { applied: [], pending: undefined });
});

test("stage: swallows a failed channel fetch", async (): Promise<void> => {
    assert.deepEqual(await runListener({ channelFails: true }), { applied: [], pending: undefined });
});

/**
 * Build a fake client whose `voiceStates.setSuppress` records the calls.
 * @param {boolean} [reject] Whether the request rejects (e.g. missing `MuteMembers`).
 * @returns {{ client: never; calls: [string, boolean][] }} The client and its recorded calls.
 */
function suppressClient(reject: boolean = false): { client: never; calls: [string, boolean][] } {
    const calls: [string, boolean][] = [];
    const client = {
        voiceStates: {
            setSuppress: (guildId: string, value: boolean): Promise<void> => {
                calls.push([guildId, value]);
                return reject ? Promise.reject(new Error("missing permissions")) : Promise.resolve();
            },
        },
    } as never;

    return { client, calls };
}

test("release: raises a deferred bot once the node reports the connection up", async (): Promise<void> => {
    const { client, calls } = suppressClient();
    const player: FakePlayer = fakePlayer(true);
    player.data.set("pendingUnsuppress", true);

    await releaseUnsuppress(client, player as never);
    await releaseUnsuppress(client, player as never);

    assert.deepEqual(calls, [["guild-1", false]], "the pending unsuppress must be applied exactly once");
    assert.equal(player.data.store.has("pendingUnsuppress"), false);
});

test("release: waits while the node still reports the connection down", async (): Promise<void> => {
    const { client, calls } = suppressClient();
    const player: FakePlayer = fakePlayer(false);
    player.data.set("pendingUnsuppress", true);

    await releaseUnsuppress(client, player as never);

    assert.deepEqual(calls, []);
    assert.equal(player.data.store.get("pendingUnsuppress"), true, "the unsuppress must stay pending");
});

test("release: does nothing without a pending unsuppress", async (): Promise<void> => {
    const { client, calls } = suppressClient();

    await releaseUnsuppress(client, fakePlayer(true) as never);

    assert.deepEqual(calls, []);
});

test("release: swallows a failed unsuppress request", async (): Promise<void> => {
    const { client, calls } = suppressClient(true);
    const player: FakePlayer = fakePlayer(true);
    player.data.set("pendingUnsuppress", true);

    await releaseUnsuppress(client, player as never);

    assert.deepEqual(calls, [["guild-1", false]]);
});

/**
 * Run `joinVoiceChannel` with the bot already sitting suppressed in the target stage channel.
 * @param {boolean} connected Whether the player's voice connection is already up before the call.
 * @returns {Promise<{ applied: boolean[]; player: FakePlayer }>} The `suppress` values applied, and the player.
 */
async function runJoin(connected: boolean): Promise<{ applied: boolean[]; player: FakePlayer }> {
    const applied: boolean[] = [];
    const player: FakePlayer = fakePlayer(connected);
    const voice = { id: "stage-1", isStage: (): boolean => true };
    const me = {
        voice: (): Promise<object> =>
            Promise.resolve({
                channelId: "stage-1",
                suppress: true,
                setSuppress: (value: boolean): Promise<void> => {
                    applied.push(value);
                    return Promise.resolve();
                },
            }),
    };

    await joinVoiceChannel(player as never, voice as never, me as never);

    return { applied, player };
}

test("join: raises a suppressed bot right away when its connection is already up", async (): Promise<void> => {
    const { applied, player } = await runJoin(true);

    assert.deepEqual(applied, [false]);
    assert.equal(player.connects, 0, "an already-connected player must not reconnect");
});

test("join: defers the unsuppress when the call only now starts the connection", async (): Promise<void> => {
    const { applied, player } = await runJoin(false);

    assert.deepEqual(applied, []);
    assert.equal(player.connects, 1);
    assert.equal(player.data.store.get("pendingUnsuppress"), true);
});
