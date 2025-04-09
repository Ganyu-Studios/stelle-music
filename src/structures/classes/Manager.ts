import { LavalinkManager } from "lavalink-client";
import type { UsingClient } from "seyfert";

import { Constants } from "#stelle/utils/data/constants.js";
import { LavalinkHandler } from "#stelle/utils/manager/handler.js";

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
     * Reload the lavalink manager. Shortcut to `LavalinkHandler#reloadAlll()`.
     * @returns {Promise<void>} A promise... and nothing else.
     */
    reloadAll(): Promise<void> {
        return this.handler.reloadAll();
    }

    /**
     *
     * Load the lavalink manager. Shortcut to `LavalinkHandler#load()`.
     * @returns {Promise<void>} A promise.
     */
    load(): Promise<void> {
        this.handler.client.logger.info("LavalinkHandler loaded");
        return this.handler.load();
    }
}
