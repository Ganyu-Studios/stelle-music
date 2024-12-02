import type { LavalinkNodeOptions } from "lavalink-client";
import { InvalidSessionId } from "#stelle/errors";

/**
 * Lavalink node options without the `sessionId`.
 */
type NonResumableOptions = Omit<LavalinkNodeOptions, "sessionId">;

/**
 * Stelle Lavalink sessions main class.
 */
export class StelleSessions {
    /**
     * The Lavalink sessions map.
     */
    readonly sessions: Map<string, string> = new Map();

    /**
     *
     * Set a node session.
     * @param nodeId The node id.
     * @param sessionId The session id.
     * @returns The current instance.
     */
    public set(nodeId: string, sessionId: string): this {
        this.sessions.set(nodeId, sessionId);
        return this;
    }

    /**
     *
     * Get a node session.
     * @param nodeId The node id.
     * @returns The session id.
     */
    public get(nodeId: string): string | undefined {
        return this.sessions.get(nodeId);
    }

    /**
     *
     * Resolve the nodes options.
     * @param nodes The array of nodes.
     * @returns
     */
    public resolve(nodes: NonResumableOptions[]): LavalinkNodeOptions[] {
        if (nodes.some((node) => "sessionId" in node && typeof node.sessionId === "string"))
            throw new InvalidSessionId("The 'sessionId' property is not allowed in the node options.");
        return nodes.map((node) => ({
            ...node,
            sessionId: this.get(node.id ?? `${node.host}:${node.port}`),
        }));
    }
}

/**
 * The Lavalink sessions instance.
 */
export const sessions = new StelleSessions();
