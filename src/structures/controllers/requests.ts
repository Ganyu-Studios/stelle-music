import { Controller } from "#stelle/classes/database/Controller.js";
import type { guildRequestChannel } from "#stelle/prisma";

/**
 * The request-channel data to set (without the record id and guild id).
 */
type RequestChannelData = Pick<guildRequestChannel, "channelId" | "messageId">;

/**
 * Class representing the request-channel controller.
 * @class RequestsController
 * @extends Controller<"guildRequestChannel">
 */
export class RequestsController extends Controller<"guildRequestChannel"> {
    readonly modelName = "guildRequestChannel";

    /**
     * Get the request-channel config for a guild.
     * @param {string} guildId The id of the guild.
     * @returns {Promise<guildRequestChannel | null>} The config, or null if the guild has no request channel.
     */
    public get(guildId: string): Promise<guildRequestChannel | null> {
        return this.fetch({
            read: () => this.cache.getGuild(guildId)?.requests,
            write: (record): void => {
                this.cache.guild(guildId).requests = record;
            },
            query: () => this.model.findUnique({ where: { guildId } }),
        });
    }

    /**
     * Set (create or update) the request-channel config for a guild.
     * @param {string} guildId The id of the guild.
     * @param {RequestChannelData} data The channel id and panel message id to store.
     * @returns {Promise<void>} A promise that resolves when the config is saved.
     */
    public set(guildId: string, data: RequestChannelData): Promise<void> {
        return this.store({
            write: (record): void => {
                this.cache.guild(guildId).requests = record;
            },
            query: () => this.model.upsert({ where: { guildId }, create: { guildId, ...data }, update: data }),
        });
    }

    /**
     * Delete the request-channel config for a guild (used by `disable`).
     * @param {string} guildId The id of the guild.
     * @returns {Promise<void>} A promise that resolves when the config is deleted.
     */
    public delete(guildId: string): Promise<void> {
        return this.remove({
            evict: (): void => {
                this.cache.guild(guildId).requests = null;
            },
            query: () => this.model.delete({ where: { guildId } }),
        });
    }
}
