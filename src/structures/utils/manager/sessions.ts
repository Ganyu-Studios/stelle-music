import type { NodeOptions, PlayerStructure } from "hoshimi";
import MeowDB from "meowdb";
import type { MakeRequired, RestOrArray } from "seyfert/lib/common/index.js";
import type { NonOptionsNode, SessionJson, StellePlayerJson } from "#stelle/types";
import { StellePaths } from "#stelle/utils/data/constants.js";
import { InvalidNodeSession } from "#stelle/utils/errors.js";
import { ms } from "#stelle/utils/functions/internal/time.js";
import { UtilsOps } from "#stelle/utils/functions/internal/utils.js";

/**
 * Lavalink node options without the `sessionId`.
 */
//i don't know how to name this type, so i just called like this
type NonResumableNodeOptions = Omit<NodeOptions, "sessionId">;

/**
 * The player json with the required properties.
 */
type RequiredPlayerJson = MakeRequired<StellePlayerJson>;

/**
 * The directory where the cache is stored.
 * @type {string}
 */
const dir: string = await UtilsOps.createDir(StellePaths.CacheDirectory);

/**
 * The name of the sessions file without the `.json` extension.
 * @type {string}
 */
const name: string = StellePaths.SessionsFile.replace(/\.json$/, "").trim();

/**
 * The storage for player sessions.
 * @type {MeowDB}
 */
const storage: MeowDB = new MeowDB({ dir, name });

/**
 * The session ids of the nodes.
 * @type {Map<string, string>}
 */
const ids: Map<string, string> = new Map<string, string>(
    Object.values<StellePlayerJson>(storage.all())
        .filter(
            (session): session is RequiredPlayerJson => typeof session.node.id === "string" && typeof session.node.sessionId === "string",
        )
        .map((session) => [session.node.id, session.node.sessionId!]),
);

/**
 * Utility to manage Lavalink node sessions.
 */
export const Sessions = {
    /**
     *
     * Set the session of the player.
     * @param {string} id The id of the session
     * @param {string} value The value of the session.
     * @returns {void} Did you know, this saves the session into a json file? No way!
     */
    set<T>(id: string, value: T): void {
        storage.set<T>(id, value);
        return;
    },
    /**
     * Get the session of the player.
     * @param {string} id The id of the session.
     * @return {T | undefined} The value of the session.
     */
    get<T>(id: string): T | undefined {
        return storage.get<T>(id);
    },
    /**
     * Delete the session of the player.
     * @param {string} id The id of the session.
     * @return {boolean} Whether the session was deleted or not.
     */
    delete(id: string): boolean {
        // this throws an error if there's no session with the id.
        return storage.exists(id) && storage.delete(id);
    },
    /**
     * Resolves the  node options to include the session id.
     * @param {RestOrArray<NonResumableNodeOptions>} nodes The nodes to resolve.
     * @returns {LavalinkNodeOptions[]} The resolved nodes.
     */
    resolve(...nodes: RestOrArray<NonResumableNodeOptions>): NodeOptions[] {
        nodes = nodes.flat();

        if (nodes.some((node): boolean => "sessionId" in node && typeof node.sessionId === "string"))
            throw new InvalidNodeSession("The 'sessionId' property is not allowed in the node options.");

        return nodes.map((node) => {
            // default settings, if not set by the user.
            node.id ??= `${node.host}:${node.port}`;
            node.retryAmount ??= 25;
            node.retryDelay ??= ms("25s");
            node.restTimeout ??= ms("30s");

            return {
                ...node,
                sessionId: ids.get(node.id),
            };
        });
    },
    /**
     *
     * Snapshot a player into its persisted session, so it can be recreated after a restart, node resume or a 24/7
     * autoreconnect. Mirrors the shape read back by `resumeListener` and the destroy autoreconnect. Callers gate
     * this on `config.sessions.enabled`.
     * @param {PlayerStructure} player The player to persist.
     * @returns {Promise<void>} A promise that resolves once the session is written.
     */
    async save(player: PlayerStructure): Promise<void> {
        const json = player.toJSON();
        if (json.queue?.current) json.queue.current.userData = {};

        const base = UtilsOps.omit(json, [
            "ping",
            "createdTimestamp",
            "lastPositionUpdate",
            "paused",
            "playing",
            "queue",
            "filters",
            "node",
        ]);
        const node: NonOptionsNode = UtilsOps.omit(json.node, ["options"]);

        this.set<SessionJson>(player.guildId, {
            ...base,
            messageId: await player.data.get("messageId"),
            enabledAutoplay: await player.data.get("enabledAutoplay"),
            localeString: await player.data.get("localeString"),
            me: await player.data.get("me"),
            lyricsId: await player.data.get("lyricsId"),
            lyricsEnabled: await player.data.get("lyricsEnabled"),
            is247: await player.data.get("is247"),
            isAutoPause: await player.data.get("isAutoPause"),
            isRequestChannel: await player.data.get("isRequestChannel"),
            node,
        });
    },
};
