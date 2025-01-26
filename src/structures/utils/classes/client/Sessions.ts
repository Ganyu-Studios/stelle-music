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
 * Stelle Lavalink sessions main class.
 */
export class StelleSessions {
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
        Object.entries<StellePlayerJson>(StelleSessions.storage.all()).map(([_, session]) => [session.nodeId!, session.nodeSessionId!]),
    );

    /**
     *
     * Set a player session.
     * @param guildId The node id.
     * @param object The session id.
     * @returns The current instance.
     */
    public set<T>(guildId: string, object: T): this {
        StelleSessions.storage.set<T>(guildId, object);
        return this;
    }

    /**
     *
     * Get a player session.
     * @param guildId The node id.
     * @returns The session id.
     */
    public get<T>(guildId: string): T | undefined {
        return StelleSessions.storage.get<T>(guildId);
    }

    /**
     *
     * Delete a player session.
     * @param guildId The node id.
     * @returns If the session was deleted.
     */
    public delete(guildId: string): boolean {
        return StelleSessions.storage.exists(guildId) && StelleSessions.storage.delete(guildId);
    }

    /**
     *
     * Resolve the nodes options.
     * @param nodes The array of nodes to resolve.
     * @returns
     */
    public static resolve(...nodes: RestOrArray<NonResumableOptions>): LavalinkNodeOptions[] {
        if (nodes.some((node) => "sessionId" in node && typeof node.sessionId === "string"))
            throw new InvalidSession("The 'sessionId' property is not allowed in the node options.");

        return nodes.flat().map((node) => ({
            ...node,
            sessionId: StelleSessions.nodes.get(node.id ?? `${node.host}:${node.port}`),
        }));
    }
}
