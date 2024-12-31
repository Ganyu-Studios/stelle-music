import type { LavalinkNodeOptions } from "lavalink-client";
import { InvalidSessionId } from "#stelle/errors";
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
    readonly storage = new MeowDB({
        dir: process.cwd(),
        name: "sessions",
    });

    /**
     * The nodes map.
     */
    readonly nodes: Map<string, string> = new Map(
        Object.entries<StellePlayerJson>(this.storage.all()).map(([_, session]) => [session.nodeId!, session.nodeSessionId!]),
    );

    /**
     *
     * Set a player session.
     * @param guildId The node id.
     * @param object The session id.
     * @returns The current instance.
     */
    public set<T>(guildId: string, object: T): this {
        this.storage.set<T>(guildId, object);
        return this;
    }

    /**
     *
     * Get a player session.
     * @param guildId The node id.
     * @returns The session id.
     */
    public get<T>(guildId: string): T | undefined {
        return this.storage.get<T>(guildId);
    }

    /**
     *
     * Delete a player session.
     * @param guildId The node id.
     * @returns If the session was deleted.
     */
    public delete(guildId: string): boolean {
        return this.storage.exists(guildId) && this.storage.delete(guildId);
    }

    /**
     *
     * Get a node session.
     * @param nodeId The node id.
     * @returns The session id.
     */
    public getNode(nodeId: string): string | undefined {
        return this.nodes.get(nodeId);
    }

    /**
     *
     * Resolve the nodes options.
     * @param nodes The array of nodes to resolve.
     * @returns
     */
    public resolve(nodes: NonResumableOptions[]): LavalinkNodeOptions[] {
        if (nodes.some((node) => "sessionId" in node && typeof node.sessionId === "string"))
            throw new InvalidSessionId("The 'sessionId' property is not allowed in the node options.");

        return nodes.map((node) => ({
            ...node,
            sessionId: this.getNode(node.id ?? `${node.host}:${node.port}`),
        }));
    }
}

/**
 * The Lavalink sessions instance.
 */
export const sessions = new StelleSessions();
