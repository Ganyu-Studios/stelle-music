import { Kazagumo } from "kazagumo";
import { Connectors } from "shoukaku";

import type { Stelle } from "#stelle/client";

import Spotify from "kazagumo-spotify";
import { StelleHandler } from "#stelle/utils/classes/client/Handler.js";

/**
 * Main music manager class.
 */
export class StelleManager extends Kazagumo {
    readonly handler: StelleHandler;

    /**
     *
     * Create a new instance of the manager.
     * @param client
     */
    constructor(client: Stelle) {
        super(
            {
                defaultSearchEngine: "youtube",
                defaultYoutubeThumbnail: "maxresdefault",
                plugins: [new Spotify(client.config.spotify)],
                send: (guildId, payload) => client.gateway.send(client.gateway.calculateShardId(guildId), payload),
            },
            new Connectors.Seyfert(client),
            client.config.nodes,
        );

        this.handler = new StelleHandler(client);
    }

    /**
     * Load the manager.
     */
    public async load(): Promise<void> {
        //... no.
        await this.handler.load();
        this.handler.client.logger.info("MusicManager loaded");
    }
}
