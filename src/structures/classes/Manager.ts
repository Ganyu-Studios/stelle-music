import { LavalinkManager } from "lavalink-client";
import type { UsingClient } from "seyfert";

/**
 * Class representing the lavalink manager of the bot.
 * @extends LavalinkManager
 * @class StelleManager
 */
export class StelleManager extends LavalinkManager {
    /**
     * The client that is using this manager.
     * @type {UsingClient}
     */
    protected client: UsingClient;

    /**
     * Creates an instance of StelleManager.
     * @param {UsingClient} client The client that is using this manager.
     */
    constructor(client: UsingClient) {
        super({
            nodes: [],
            sendToShard: (guildId, payload) => client.gateway.send(client.gateway.calculateShardId(guildId), payload),
        });

        this.client = client;
    }
}
