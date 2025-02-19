import { PrismaClient } from "@prisma/client";

import type { SearchPlatform } from "lavalink-client";
import type { UsingClient } from "seyfert";

import { Cache } from "#stelle/classes";
import { Configuration } from "#stelle/data/Configuration.js";
import { StelleKeys } from "#stelle/types";

//🗿
const prismaClient = new PrismaClient();

/**
 * Main Stelle database class.
 */
export class StelleDatabase {
    private client: UsingClient;
    private prisma!: PrismaClient;

    private cache: Cache = new Cache();
    private connected: boolean = false;

    /**
     *
     * Create a instance of the database.
     * @param client The client.
     */
    constructor(client: UsingClient) {
        this.client = client;
        this.prisma = prismaClient;
    }

    /**
     * Return if Stelle is connected to the Database.
     */
    public isConnected(): boolean {
        return this.connected;
    }

    /**
     * Connect Stelle to the database.
     */
    public connect(): Promise<void> {
        return this.prisma
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
     * @param guildId The guild id.
     * @returns {Promise<string>} The locale.
     */
    public async getLocale(guildId: string): Promise<string> {
        const cached = this.cache.get(guildId, StelleKeys.Locale);
        if (cached) return cached.locale!;

        const data = await this.prisma.guildLocale.findUnique({ where: { id: guildId } });
        return data?.locale ?? this.client.config.defaultLocale;
    }

    /**
     *
     * Get the guild prefix from the database.
     * @param guildId The guild id.
     * @returns {Promise<string>} The prefix.
     */
    public async getPrefix(guildId: string): Promise<string> {
        const cached = this.cache.get(guildId, StelleKeys.Prefix);
        if (cached) return cached.prefix!;

        const data = await this.prisma.guildPrefix.findUnique({ where: { id: guildId } });
        return data?.prefix ?? this.client.config.defaultPrefix;
    }

    /**
     *
     * Get the guild player from the database.
     * @param guildId The guild id.
     * @returns {Promise<PlayerData>} The player data.
     */
    public async getPlayer(guildId: string): Promise<Pick<NonNullable<PlayerData>, "defaultVolume" | "searchEngine">> {
        const cached = this.cache.get(guildId, StelleKeys.Player);
        if (cached)
            return {
                defaultVolume: cached.defaultVolume!,
                searchEngine: cached.searchEngine! as SearchPlatform,
            };

        const data = await this.prisma.guildPlayer.findUnique({ where: { id: guildId } });
        return {
            defaultVolume: data?.defaultVolume ?? Configuration.defaultVolume,
            searchEngine: (data?.searchEngine as SearchPlatform | null | undefined) ?? Configuration.defaultSearchEngine,
        };
    }

    /**
     *
     * Set the guild locale to the database.
     * @param guildId The guild id.
     * @param locale The locale.
     * @returns {Promise<void>} The promise.
     */
    public async setLocale(guildId: string, locale: string): Promise<void> {
        await this.prisma.guildLocale.upsert({
            where: { id: guildId },
            update: { locale },
            create: {
                id: guildId,
                locale,
            },
        });

        this.cache.set(guildId, StelleKeys.Locale, {
            id: guildId,
            locale,
        });
    }

    /**
     *
     * Set the guild prefix to the database.
     * @param guildId The guild id.
     * @param prefix The prefix.
     * @returns {Promise<void>} The promise.
     */
    public async setPrefix(guildId: string, prefix: string): Promise<void> {
        await this.prisma.guildPrefix.upsert({
            where: { id: guildId },
            update: { prefix },
            create: {
                id: guildId,
                prefix,
            },
        });

        this.cache.set(guildId, StelleKeys.Prefix, {
            id: guildId,
            prefix,
        });
    }

    /**
     *
     * Set the guild player to the database.
     * @param options The player options.
     * @returns {Promise<void>} The promise.
     */
    public async setPlayer({ guildId, defaultVolume, searchEngine }: PlayerData): Promise<void> {
        const data = await this.getPlayer(guildId);

        defaultVolume ??= data.defaultVolume;
        searchEngine ??= data.searchEngine;

        await this.prisma.guildPlayer.upsert({
            where: { id: guildId },
            update: { defaultVolume, searchEngine },
            create: { id: guildId, defaultVolume, searchEngine },
        });

        this.cache.set(guildId, StelleKeys.Player, {
            id: guildId,
            defaultVolume: defaultVolume!,
            searchEngine: searchEngine as SearchPlatform,
        });
    }
}

interface PlayerData {
    guildId: string;
    searchEngine?: SearchPlatform;
    defaultVolume?: number;
}
