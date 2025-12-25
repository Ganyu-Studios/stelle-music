import { Controller } from "#stelle/classes/Controller.js";
import { CacheKeys } from "#stelle/types";

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
        const cached = this.cache.get(CacheKeys.Prefix, guildId);
        if (cached?.prefix) return cached.prefix;

        const data = await this.model.findUnique({ where: { guildId } });
        if (data?.prefix) return data.prefix;

        return this.client.config.defaultPrefix;
    }

    /**
     * Set the prefix for a guild.
     * @param {string} id The id of the guild.
     * @param {string} prefix The prefix to set.
     * @returns {Promise<void>} A promise that resolves when the prefix is set.
     */
    public async set(id: string, prefix: string): Promise<void> {
        await this.model
            .upsert({
                where: { guildId: id },
                create: { guildId: id, prefix },
                update: { prefix },
            })
            .then((data) => this.cache.set(CacheKeys.Prefix, data.guildId, data));
    }
}
