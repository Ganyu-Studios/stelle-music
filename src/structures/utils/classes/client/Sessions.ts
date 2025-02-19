import type { LavalinkNodeOptions } from "lavalink-client";
import type { RestOrArray } from "seyfert/lib/common/index.js";
import { InvalidSession } from "#stelle/errors";
import type { StellePlayerJson } from "#stelle/types";

import MeowDB from "meowdb";

/**
 * Lavalink node options without the `sessionId`.
 */
type NonResumableOptions = Omit<LavalinkNodeOptions, "sessionId">;

/**
 * Main Stelle Lavalink sessions main class.
 */
export class Sessions {
    /**
     * The storage instance.
     */
    static readonly storage = new MeowDB({
        dir: process.cwd(),
        name: "sessions",
    });

    /**
     * The nodes map.
     */
    static readonly nodes: Map<string, string> = new Map(
        Object.values<StellePlayerJson>(Sessions.storage.all()).map((session) => [session.nodeId!, session.nodeSessionId!]),
    );

    /**
     *
     * Set a player session.
     * @param guildId The node id.
     * @param object The session id.
     * @returns {T} The current instance.
     */
    public static set<T>(guildId: string, object: T): T {
        return Sessions.storage.set<T>(guildId, object);
    }

    /**
     *
     * Get a player session.
     * @param guildId The node id.
     * @returns {T | undefined} The session id.
     */
    public static get<T>(guildId: string): T | undefined {
        return Sessions.storage.get<T>(guildId);
    }

    /**
     *
     * Delete a player session.
     * @param guildId The node id.
     * @returns {boolean} If the session was deleted.
     */
    public static delete(guildId: string): boolean {
        return Sessions.storage.exists(guildId) && Sessions.storage.delete(guildId);
    }

    /**
     *
     * Get a node session using the node id.
     * @param id The id of the node.
     * @returns {string | undefined} The session id.
     */
    public static getNode(id: string): string | undefined {
        return Sessions.nodes.get(id);
    }

    /**
     *
     * Resolve the nodes options.
     * @param nodes The array of nodes to resolve.
     * @returns {LavalinkNodeOptions[]} The resolved nodes.
     */
    public static resolve(...nodes: RestOrArray<NonResumableOptions>): LavalinkNodeOptions[] {
        if (nodes.some((node) => "sessionId" in node && typeof node.sessionId === "string"))
            throw new InvalidSession("The 'sessionId' property is not allowed in the node options.");

        return nodes.flat().map((node) => ({
            ...node,
            sessionId: Sessions.getNode(node.id ?? `${node.host}:${node.port}`),
        }));
    }
}
