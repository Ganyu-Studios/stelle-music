import { LavalinkManager, type SearchPlatform, type Track } from "lavalink-client";

import { StelleHandler } from "#stelle/utils/classes/client/Handler.js";

import type { UsingClient } from "seyfert";
import { autoPlayFunction } from "#stelle/utils/functions/autoplay.js";

/**
 * Main music manager class.
 */
export class StelleManager extends LavalinkManager {
    readonly handler: StelleHandler;

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
            },
            playerOptions: {
                defaultSearchPlatform: "spsearch",
                onDisconnect: {
                    destroyPlayer: true,
                },
                onEmptyQueue: {
                    autoPlayFunction,
                },
            },
        });

        this.handler = new StelleHandler(client);
    }

    /**
     *
     * Search tracks.
     * @param query The query.
     * @returns
     */
    public async search(query: string, source?: SearchPlatform): Promise<Track[]> {
        const nodes = this.nodeManager.leastUsedNodes();
        const node = nodes[Math.floor(Math.random() * nodes.length)];
        const result = await node.search({ query, source }, null, false);
        return result.tracks;
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
