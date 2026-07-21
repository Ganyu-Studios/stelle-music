import { Controller } from "#stelle/classes/Controller.js";

/**
 * Class representing the prefix controller.
 * @class PrefixController
 * @extends Controller<"guildPrefix">
 */
export class PrefixController extends Controller<"guildPrefix"> {
    readonly modelName = "guildPrefix";

    /**
     * Get the prefix for a guild.
     * @param {string} guildId The id of the guild.
     * @returns {Promise<string>} The prefix for the guild.
     */
    public async get(guildId: string): Promise<string> {
        const data = await this.cacheGet({
            read: () => this.database.cache.getGuild(guildId)?.prefix,
            write: (record): void => {
                this.database.cache.guild(guildId).prefix = record;
            },
            query: () => this.model.findUnique({ where: { guildId } }),
        });

        return data?.prefix ?? this.database.client.config.defaultPrefix;
    }

    /**
     * Set the prefix for a guild.
     * @param {string} guildId The id of the guild.
     * @param {string} prefix The prefix to set.
     * @returns {Promise<void>} A promise that resolves when the prefix is set.
     */
    public set(guildId: string, prefix: string): Promise<void> {
        return this.cacheSet({
            write: (record): void => {
                this.database.cache.guild(guildId).prefix = record;
            },
            query: () => this.model.upsert({ where: { guildId }, create: { guildId, prefix }, update: { prefix } }),
        });
    }
}
