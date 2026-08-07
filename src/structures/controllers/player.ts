import type { SearchSources } from "hoshimi";
import { Controller } from "#stelle/classes/database/Controller.js";

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
        const data = await this.cacheGet({
            read: () => this.cache.getGuild(id)?.player,
            write: (record): void => {
                this.cache.guild(id).player = record;
            },
            query: () => this.model.findUnique({ where: { guildId: id } }),
        });

        return {
            defaultVolume: data?.defaultVolume ?? this.client.config.defaultVolume,
            searchPlatform: (data?.searchPlatform as SearchSources) ?? this.client.config.defaultSearchSource,
        };
    }

    /**
     *
     * Set the guild player to the database.
     * @param {string} guildId The guild id.
     * @param {Partial<StoredPlayer>} data The player data to set.
     * @returns {Promise<void>} A promise that resolves when the player is set.
     */
    public set(guildId: string, data: Partial<StoredPlayer>): Promise<void> {
        return this.cacheSet({
            write: (record): void => {
                this.cache.guild(guildId).player = record;
            },
            query: () => this.model.upsert({ where: { guildId }, update: data, create: { guildId, ...data } }),
        });
    }
}
