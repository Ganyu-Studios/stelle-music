import type { SearchSources } from "hoshimi";
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
     * @type {SearchSources}
     */
    searchPlatform: SearchSources;
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
        const cached = this.cache.get(CacheKeys.Player, id);
        if (cached)
            return {
                defaultVolume: cached.defaultVolume,
                searchPlatform: cached.searchPlatform as SearchSources,
            };

        const data = await this.model.findUnique({ where: { guildId: id } });
        if (!data)
            return {
                defaultVolume: this.client.config.defaultVolume,
                searchPlatform: this.client.config.defaultSearchSource,
            };

        return {
            defaultVolume: data.defaultVolume,
            searchPlatform: data.searchPlatform as SearchSources,
        };
    }

    /**
     *
     * Set the guild player to the database.
     * @param {string} guildId The guild id.
     * @param {Partial<StoredPlayer>} data The player data to set.
     * @returns {Promise<void>} A promise that resolves when the player is set.
     */
    public async set(guildId: string, data: Partial<StoredPlayer>): Promise<void> {
        await this.model
            .upsert({
                where: { guildId },
                update: data,
                create: {
                    guildId,
                    ...data,
                },
            })
            .then((data) => this.cache.set(CacheKeys.Player, data.guildId, data));
    }
}
