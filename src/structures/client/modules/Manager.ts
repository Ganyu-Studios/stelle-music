import { LavalinkManager, type SearchPlatform, type SearchResult } from "lavalink-client";
import type { UsingClient } from "seyfert";

import { LavalinkHandler, RedisClient, RedisQueueStore } from "#stelle/classes";
import { autoPlayFunction } from "#stelle/utils/functions/autoplay.js";
import { requesterTransformer } from "#stelle/utils/functions/utils.js";

import { DEBUG_MODE } from "#stelle/data/Constants.js";

/**
 * Main music manager class.
 */
export class StelleManager extends LavalinkManager {
    /**
     * The lavalink manager handler.
     */
    readonly handler: LavalinkHandler;

    /**
     *
     * Create a new instance of the manager.
     * @param client The client.
     */
    constructor(client: UsingClient) {
        super({
            nodes: client.config.nodes,
            sendToShard: (guildId, payload) => client.gateway.send(client.gateway.calculateShardId(guildId), payload),
            queueOptions: {
                maxPreviousTracks: 25,
                queueStore: new RedisQueueStore(new RedisClient(client)),
            },
            advancedOptions: {
                enableDebugEvents: DEBUG_MODE,
                debugOptions: {
                    logCustomSearches: DEBUG_MODE,
                    noAudio: DEBUG_MODE,
                    playerDestroy: {
                        debugLog: DEBUG_MODE,
                        dontThrowError: DEBUG_MODE,
                    },
                },
            },
            playerOptions: {
                requesterTransformer,
                defaultSearchPlatform: "spsearch",
                onDisconnect: {
                    destroyPlayer: true,
                },
                onEmptyQueue: {
                    autoPlayFunction,
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
    public search(query: string, source?: SearchPlatform): Promise<SearchResult> {
        const nodes = this.nodeManager.leastUsedNodes();
        const node = nodes[Math.floor(Math.random() * nodes.length)];

        return node.search({ query, source }, null, false);
    }

    /**
     * Load the manager.
     */
    public async load(): Promise<void> {
        //... no.
        await this.handler.load();
        this.handler.client.logger.info("MusicHandler loaded");
    }
}
