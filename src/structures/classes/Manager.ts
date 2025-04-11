import { LavalinkManager, type LavalinkNode, type SearchPlatform, type SearchResult } from "lavalink-client";
import type { UsingClient } from "seyfert";

import { Constants } from "#stelle/utils/data/constants.js";
import { LavalinkHandler } from "#stelle/utils/manager/handler.js";

/**
 *
 * Calculate the penalties for a lavalink node.
 * @param {LavalinkNode} node The lavalink node to check the penalties for.
 * @returns {number} The penalties for the node.
 */
const penalties = (node: LavalinkNode): number => {
    if (!node.stats) return 0;

    const { players, cpu, frameStats } = node.stats;
    const cpuPenalty = Math.round(1.05 ** (100 * cpu.systemLoad) * 10 - 10);
    const framePenalty = frameStats ? (frameStats.deficit ?? 0) + (frameStats.nulled ?? 0) * 2 : 0;

    return players + cpuPenalty + framePenalty;
};

/**
 * Class representing the lavalink manager of the bot.
 * @extends LavalinkManager
 * @class StelleManager
 */
export class StelleManager extends LavalinkManager {
    /**
     * The lavalink handler of the bot.
     * @type {LavalinkHandler}
     * @protected
     * @readonly
     */
    protected readonly handler: LavalinkHandler;

    /**
     * Creates an instance of StelleManager.
     * @param {UsingClient} client The client that is using this manager.
     */
    constructor(client: UsingClient) {
        super({
            nodes: client.config.nodes,
            sendToShard: (guildId, payload) => client.gateway.send(client.gateway.calculateShardId(guildId), payload),
            queueOptions: {
                maxPreviousTracks: 25,
            },
            advancedOptions: {
                enableDebugEvents: Constants.Debug,
                debugOptions: {
                    logCustomSearches: Constants.Debug,
                    noAudio: Constants.Debug,
                    playerDestroy: {
                        debugLog: Constants.Debug,
                        dontThrowError: Constants.Debug,
                    },
                },
            },
            playerOptions: {
                defaultSearchPlatform: "spsearch",
                onDisconnect: {
                    destroyPlayer: true,
                },
            },
        });

        this.handler = new LavalinkHandler(client);
    }

    /**
     *
     * Search tracks.
     * @param query The query.
     * @returns {Promise<SearchResult>} The search result.
     */
    public search(query: string, source?: SearchPlatform): Promise<SearchResult | null> {
        if (!query.length) return Promise.resolve(null);

        const nodes = this.nodeManager.leastUsedNodes();
        const node = nodes.reduce((a, b) => (penalties(a) < penalties(b) ? a : b));

        return node.search({ query, source }, null, false).catch(() => null);
    }

    /**
     *
     * Reload the lavalink manager. Shortcut to `LavalinkHandler#reloadAlll()`.
     * @returns {Promise<void>} A promise... and nothing else.
     */
    public reloadAll(): Promise<void> {
        return this.handler.reloadAll();
    }

    /**
     *
     * Load the lavalink manager. Shortcut to `LavalinkHandler#load()`.
     * @returns {Promise<void>} A promise.
     */
    public load(): Promise<void> {
        this.handler.client.logger.info("LavalinkHandler loaded");
        return this.handler.load();
    }
}
