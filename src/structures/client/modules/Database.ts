import type { SearchPlatform } from "lavalink-client";
import type { UsingClient } from "seyfert";

import { Configuration } from "#stelle/data/Configuration.js";
import { PrismaClient } from "@prisma/client";
import { StelleKeys } from "#stelle/types";
import { Cache } from "#stelle/classes";

// 🗿
const prismaClient = new PrismaClient();

/**
 * Main Stelle database class.
 */
export class StelleDatabase {
    private cache: Cache = new Cache();

    private prisma!: PrismaClient;

    private client: UsingClient;

    private connected = false;

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
     *
     * Set the guild player to the database.
     * @param options The player options.
     * @returns
     */
    public async setPlayer({ guildId, defaultVolume, searchEngine }: PlayerData): Promise<void> {
        const data = await this.getPlayer(guildId);

        defaultVolume ??= data.defaultVolume;
        searchEngine ??= data.searchEngine;

        await this.prisma.guildPlayer.upsert({
            where: { id: guildId },
            update: {
                defaultVolume,
                searchEngine
            },
            create: {
                id: guildId,
                defaultVolume,
                searchEngine
            }
        });

        this.cache.set(guildId, StelleKeys.Player, {
            id: guildId,
            defaultVolume: defaultVolume!,
            searchEngine: searchEngine!
        });
    }

    /**
     *
     * Get the guild player from the database.
     * @param guildId The guild id.
     * @returns
     */
    public async getPlayer(guildId: string): Promise<Pick<NonNullable<PlayerData>, "defaultVolume" | "searchEngine">> {
        const cached = this.cache.get(guildId, StelleKeys.Player);
        if (cached) {
            return {
                defaultVolume: cached.defaultVolume!,
                searchEngine: cached.searchEngine! as SearchPlatform
            };
        }

        const data = await this.prisma.guildPlayer.findUnique({ where: { id: guildId } });
        return {
            defaultVolume: data?.defaultVolume ?? Configuration.defaultVolume,
            searchEngine: (data?.searchEngine as SearchPlatform | undefined | null) ?? Configuration.defaultSearchEngine
        };
    }

    /**
     *
     * Set the guild locale to the database.
     * @param guildId The guild id.
     * @param locale The locale.
     */
    public async setLocale(guildId: string, locale: string): Promise<void> {
        await this.prisma.guildLocale.upsert({
            where: { id: guildId },
            update: { locale },
            create: {
                id: guildId,
                locale
            }
        });

        this.cache.set(guildId, StelleKeys.Locale, {
            id: guildId,
            locale
        });
    }

    /**
     *
     * Set the guild prefix to the database.
     * @param guildId The guild id.
     * @param prefix The prefix.
     */
    public async setPrefix(guildId: string, prefix: string): Promise<void> {
        await this.prisma.guildPrefix.upsert({
            where: { id: guildId },
            update: { prefix },
            create: {
                id: guildId,
                prefix
            }
        });

        this.cache.set(guildId, StelleKeys.Prefix, {
            id: guildId,
            prefix
        });
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
            .catch((error: unknown) => {
                this.client.logger.error("Database -", error);
            });
    }

    /**
     *
     * Get the guild locale from the database.
     * @param guildId The guild id.
     * @returns
     */
    public async getLocale(guildId: string): Promise<string> {
        const cached = this.cache.get(guildId, StelleKeys.Locale);
        if (cached) {
            return cached.locale!;
        }

        const data = await this.prisma.guildLocale.findUnique({ where: { id: guildId } });
        return data?.locale ?? this.client.config.defaultLocale;
    }

    /**
     *
     * Get the guild prefix from the database.
     * @param guildId The guild id.
     * @returns
     */
    public async getPrefix(guildId: string): Promise<string> {
        const cached = this.cache.get(guildId, StelleKeys.Prefix);
        if (cached) {
            return cached.prefix;
        }

        const data = await this.prisma.guildPrefix.findUnique({ where: { id: guildId } });
        return data?.prefix ?? this.client.config.defaultPrefix;
    }

    /**
     * Return if Stelle is connected to the Database.
     */
    public isConnected(): boolean {
        return this.connected;
    }
}

interface PlayerData {
    searchEngine?: SearchPlatform;
    defaultVolume?: number;
    guildId: string;
}
