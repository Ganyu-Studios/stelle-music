import type { SearchPlatform } from "lavalink-client";
import { Controller } from "#stelle/classes/Controller.js";
import { CacheKeys } from "#stelle/types";

/**
 * The interface of the guild player.
 */
interface StoredPlayer {
    /**
     * The default volume of the player.
     * @type {number}
     */
    defaultVolume: number;
    /**
     * The search platform of the player.
     * @type {SearchPlatform}
     */
    searchPlatform: SearchPlatform;
}

/**
 * Class representing the player controller.
 * @class PlayerController
 * @extends Controller<"guildPlayer">
 */
export class PlayerController extends Controller<"guildPlayer"> {
    readonly modelName = "guildPlayer";

    /**
     *
     * Get the guild player from the database.
     * @param {string} id The guild id.
     * @returns {Promise<StoredPlayer>} The player data of the guild.
     */
    public async get(id: string): Promise<StoredPlayer> {
        const cache = this.cache.get(CacheKeys.Player, id);
        if (cache?.defaultVolume && cache?.searchPlatform)
            return {
                defaultVolume: cache.defaultVolume,
                searchPlatform: cache.searchPlatform as SearchPlatform,
            };

        const data = await this.model.findUnique({ where: { guildId: id } });
        return {
            defaultVolume: data?.defaultVolume ?? this.client.config.defaultVolume,
            searchPlatform: (data?.searchPlatform as SearchPlatform | null | undefined) ?? this.client.config.defaultSearchPlatform,
        };
    }

    /**
     *
     * Set the guild player to the database.
     * @param {string} guildId The guild id.
     * @param {Partial<StoredPlayer>} player The player data to set.
     * @returns {Promise<void>} A promise that resolves when the player is set.
     */
    public async set(guildId: string, player: Partial<StoredPlayer>): Promise<void> {
        await this.model
            .upsert({
                where: { guildId },
                update: player,
                create: {
                    guildId,
                    ...player,
                },
            })
            .then((data) => this.cache.set(CacheKeys.Player, data.guildId, data));
    }
}
