import assert from "node:assert/strict";
import { test } from "node:test";

const { playerListener } = await import("#stelle/utils/listeners/player/playerListener.js");

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
    /**
     * Whether the fake `setSuppress` request rejects (e.g. missing `MuteMembers`).
     * @type {boolean}
     * @default false
     */
    rejectUnsuppress?: boolean;
}

/**
 * Run `playerListener` against fakes. The fake player has no text channel, so the listener stops right after the
 * stage handling and never reaches the empty-channel logic or the Lavalink node.
 * @param {HarnessOptions} options The harness inputs.
 * @returns {Promise<boolean[]>} The `suppress` values the listener tried to apply.
 */
async function runListener(options: HarnessOptions = {}): Promise<boolean[]> {
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
        rejectUnsuppress = false,
    } = options;

    const applied: boolean[] = [];

    const client = {
        botId,
        debug: (): void => {},
        manager: {
            getPlayer: (): object | undefined => (hasPlayer ? { connected, textId: null, voiceId: null } : undefined),
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
            return rejectUnsuppress ? Promise.reject(new Error("missing permissions")) : Promise.resolve();
        },
    };

    const oldState = { channelId: oldChannelId };

    await playerListener(...([client, newState, oldState] as unknown as Parameters<typeof playerListener>));

    return applied;
}

test("stage: unsuppresses the bot when it lands in a stage channel", async (): Promise<void> => {
    assert.deepEqual(await runListener(), [false]);
});

test("stage: leaves a bot that lands unsuppressed alone", async (): Promise<void> => {
    assert.deepEqual(await runListener({ suppress: false }), []);
});

test("stage: ignores regular voice channels", async (): Promise<void> => {
    assert.deepEqual(await runListener({ isStage: false }), []);
});

test("stage: ignores other members joining the stage", async (): Promise<void> => {
    assert.deepEqual(await runListener({ userId: "human-1" }), []);
});

test("stage: ignores the bot while it has no connected player", async (): Promise<void> => {
    assert.deepEqual(await runListener({ connected: false }), []);
});

test("stage: ignores the bot while the guild has no player", async (): Promise<void> => {
    assert.deepEqual(await runListener({ hasPlayer: false }), []);
});

test("stage: ignores the bot leaving voice", async (): Promise<void> => {
    assert.deepEqual(await runListener({ channelId: null, oldChannelId: "stage-1" }), []);
});

test("stage: respects an in-place suppression (moderator action)", async (): Promise<void> => {
    assert.deepEqual(await runListener({ channelId: "stage-1", oldChannelId: "stage-1" }), []);
});

test("stage: swallows a failed channel fetch", async (): Promise<void> => {
    assert.deepEqual(await runListener({ channelFails: true }), []);
});

test("stage: swallows a failed unsuppress request", async (): Promise<void> => {
    assert.deepEqual(await runListener({ rejectUnsuppress: true }), [false]);
});
