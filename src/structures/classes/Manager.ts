import { Hoshimi, SearchSources } from "hoshimi";
import type { UsingClient } from "seyfert";
import { autoplayFn } from "#stelle/utils/functions/manager/autoplay.js";
import { requesterFn } from "#stelle/utils/functions/utils.js";
import { LavalinkHandler } from "#stelle/utils/manager/handler.js";
import { RedisQueueStore } from "./Store.js";

/**
 * Class representing the lavalink manager of the bot.
 * @extends LavalinkManager
 * @class StelleManager
 */
export class StelleManager extends Hoshimi {
    /**
     * The lavalink handler of the bot.
     * @type {LavalinkHandler}
     * @protected
     * @readonly
     */
    protected readonly handler: LavalinkHandler;

    /**
     * The client instance that is using this manager.
     * @type {UsingClient}
     * @protected
     * @readonly
     */
    protected readonly client: UsingClient;

    /**
     * Creates an instance of StelleManager.
     * @param {UsingClient} client The client that is using this manager.
     */
    constructor(client: UsingClient) {
        super({
            nodes: client.config.nodes,
            defaultSearchSource: SearchSources.Spotify,
            sendPayload: (guildId, payload) => {
                // just in case, but this should never happen
                if (typeof guildId !== "string" || typeof guildId === "undefined")
                    return client.logger.warn("[Manager] Invalid payload target | reason: guildId is not a string");

                return client.gateway.send(client.gateway.calculateShardId(guildId), payload);
            },
            nodeOptions: {
                moveOptions: {
                    move: true,
                },
            },
            queueOptions: {
                autoplayFn,
                storage: new RedisQueueStore(client.redis),
                maxHistory: 25,
            },
            playerOptions: {
                requesterFn,
                onDisconnect: {
                    autoDestroy: true,
                },
            },
        });

        this.handler = new LavalinkHandler(client);
        this.client = client;
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
    public async load(): Promise<void> {
        this.client.logger.info("[Manager] Lavalink handler loaded");
        await this.handler.load();
    }
}
