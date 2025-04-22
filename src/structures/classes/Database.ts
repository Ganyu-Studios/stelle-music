import type { SearchPlatform } from "lavalink-client";
import type { UsingClient } from "seyfert";
import type { LocaleString } from "seyfert/lib/types/index.js";

import { PrismaClient } from "#stelle/prisma";
import { CacheKeys } from "#stelle/types";

import { Cache } from "./Cache.js";

// cuz prisma do weird stuff
const prismaClient = new PrismaClient();

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
 * The interface of the guild request channel.
 */
interface StoredRequest {
    /**
     * The request channel id.
     * @type {string}
     */
    channelId: string;
    /**
     * The request message id.
     * @type {string | null | undefined}
     */
    messageId?: string | null;
}

/**
 * Class representing the database.
 * @class StelleDatabase
 */
export class StelleDatabase {
    /**
     * The database client instance.
     * @type {PrismaClient}
     * @readonly
     * @protected
     */
    protected readonly prisma: PrismaClient = prismaClient;

    /**
     * The database cache instance.
     * @type {Cache}
     * @readonly
     */
    readonly cache: Cache = new Cache();

    /**
     * The client instance.
     * @type {UsingClient}
     * @readonly
     * @protected
     */
    protected readonly client: UsingClient;

    /**
     * Indicates whether the database is connected.
     * @type {boolean}
     * @default false
     */
    public connected: boolean = false;

    /**
     * Creates an instance of the Database class.
     * @param {UsingClient} client The client instance.
     */
    constructor(client: UsingClient) {
        this.client = client;
    }

    /**
     * Get the database connection status.
     * @returns {boolean} The connection status.
     */
    public isConnected(): boolean {
        return this.connected;
    }

    /**
     * Connect to the database.
     * @returns {Promise<void>} A promise that returns nothing, yay!
     */
    public async connect(): Promise<void> {
        await this.prisma
            .$connect()
            .then(() => {
                this.connected = true;
                this.client.logger.info("Database - Stelle is now connected to the database.");
            })
            .catch((error) => this.client.logger.error(`Database - ${error}`));
    }

    /**
     *
     * Get the guild locale from the database.
     * @param {string} id The guild id.
     * @returns {Promise<LocaleString>} The locale of the guild.
     */
    public async getLocale(id: string): Promise<LocaleString> {
        const cache = this.cache.get(CacheKeys.Locale, id);
        if (cache?.locale) return cache.locale as LocaleString;

        const data = await this.prisma.guildLocale.findUnique({ where: { id } });
        return (data?.locale as LocaleString | null | undefined) ?? this.client.config.defaultLocale;
    }

    /**
     *
     * Get the guild prefix from the database.
     * @param {string} id The guild id.
     * @returns {Promise<string>} The prefix of the guild.
     */
    public async getPrefix(id: string): Promise<string> {
        const cache = this.cache.get(CacheKeys.Prefix, id);
        if (cache?.prefix) return cache.prefix;

        const data = await this.prisma.guildPrefix.findUnique({ where: { id } });
        return data?.prefix ?? this.client.config.defaultPrefix;
    }

    /**
     *
     * Get the guild player from the database.
     * @param {string} id The guild id.
     * @returns {Promise<StoredPlayer>} The player data of the guild.
     */
    public async getPlayer(id: string): Promise<StoredPlayer> {
        const cache = this.cache.get(CacheKeys.Player, id);
        if (cache?.defaultVolume && cache?.searchPlatform)
            return {
                defaultVolume: cache.defaultVolume,
                searchPlatform: cache.searchPlatform as SearchPlatform,
            };

        const data = await this.prisma.guildPlayer.findUnique({ where: { id } });
        return {
            defaultVolume: data?.defaultVolume ?? this.client.config.defaultVolume,
            searchPlatform: (data?.searchPlatform as SearchPlatform | null | undefined) ?? this.client.config.defaultSearchPlatform,
        };
    }

    /**
     *
     * Get the guild request channel from the database.
     * @param {string} id The guild id.
     * @returns {Promise<StoredRequest | null>} The request channel of the guild.
     */
    public async getRequest(id: string): Promise<StoredRequest | null> {
        const cache = this.cache.get(CacheKeys.Request, id);
        if (cache) return cache;

        const data = await this.prisma.guildRequest.findUnique({ where: { id } });
        return data ?? null;
    }

    /**
     *
     * Set the guild locale to the database.
     * @param {string} id The guild id.
     * @param {string} locale The locale to set.
     * @returns {Promise<void>} A magic promise, you see it?
     */
    public async setLocale(id: string, locale: string): Promise<void> {
        await this.prisma.guildLocale
            .upsert({
                where: { id },
                update: { locale },
                create: {
                    id,
                    locale,
                },
            })
            .then(({ locale }): void => this.cache.set(CacheKeys.Locale, id, { locale }));
    }

    /**
     *
     * Set the guild prefix to the database.
     * @param {string} id The guild id.
     * @param {string} prefix The prefix to set.
     * @returns {Promise<void>} A promise since we love promises.
     */
    public async setPrefix(id: string, prefix: string): Promise<void> {
        await this.prisma.guildPrefix
            .upsert({
                where: { id },
                update: { prefix },
                create: {
                    id,
                    prefix,
                },
            })
            .then(({ prefix }): void => this.cache.set(CacheKeys.Prefix, id, { prefix }));
    }

    /**
     *
     * Set the guild player to the database.
     * @param {string} id The guild id.
     * @param {Partial<StoredPlayer>} player The player data to set.
     * @returns {Promise<void>} A promise since we love promises.
     */
    public async setPlayer(id: string, player: Partial<StoredPlayer>): Promise<void> {
        await this.prisma.guildPlayer
            .upsert({
                where: { id },
                update: player,
                create: {
                    id,
                    ...player,
                },
            })
            .then(({ defaultVolume, searchPlatform }): void => this.cache.set(CacheKeys.Player, id, { defaultVolume, searchPlatform }));
    }

    /**
     *
     * Set the guild request channel to the database.
     * @param {string} id The guild id.
     * @param {StoredRequest} request The request channel to set.
     * @returns {Promise<void>} A promise since we love promises.
     */
    public async setRequest(id: string, request: StoredRequest): Promise<void> {
        await this.prisma.guildRequest
            .upsert({
                where: { id },
                update: request,
                create: {
                    id,
                    ...request,
                },
            })
            .then(({ channelId, messageId }): void => this.cache.set(CacheKeys.Request, id, { channelId, messageId }));
    }
}
