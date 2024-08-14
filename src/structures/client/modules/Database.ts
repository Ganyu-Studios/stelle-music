import { PrismaClient } from "@prisma/client";

import type { SearchPlatform } from "lavalink-client";
import type { UsingClient } from "seyfert";

import { Configuration } from "#stelle/data/Configuration.js";
import { StelleCache } from "#stelle/classes";
import { StelleKeys } from "#stelle/types";

//🗿
const prismaClient = new PrismaClient();


/**
 * Main Stelle database class.
 */
export class StelleDatabase {
    private client: UsingClient;
    private prisma!: PrismaClient;

    private storage: StelleCache = new StelleCache();
    private connected: boolean = false;

    /**
     *
     * Create a instance of the database.
     * @param client
     */
    constructor(client: UsingClient) {
        this.client = client;

        //cuz prisma makes weird stuff
        //credits: NoBody-UU for the tip
        Object.defineProperty(this, "prisma", {
            get: () => prismaClient,
        });
    }

    /**
     * Return if Stelle is connected to the Database.
     */
    public get isConnected(): boolean {
        return this.connected;
    }

    /**
     * Connect Stelle to the database.
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
     * @param guildId
     * @returns
     */
    public async getLocale(guildId: string): Promise<string> {
        const cached = this.storage.get(guildId, StelleKeys.Locale);
        if (cached) return cached.locale!;

        const data = await this.prisma.guildLocale.findUnique({ where: { id: guildId } });
        return data?.locale ?? this.client.config.defaultLocale;
    }

    /**
     *
     * Get the guild prefix from the database.
     * @param guildId
     * @returns
     */
    public async getPrefix(guildId: string): Promise<string> {
        const cached = this.storage.get(guildId, StelleKeys.Prefix);
        if (cached) return cached.prefix!;

        const data = await this.prisma.guildPrefix.findUnique({ where: { id: guildId } });
        return data?.prefix ?? this.client.config.defaultPrefix;
    }

    /**
     *
     * Get the guild player from the database.
     * @param guildId
     * @returns
     */
    public async getPlayer(guildId: string): Promise<Pick<NonNullable<PlayerData>, "defaultVolume" | "searchEngine">> {
        const cached = this.storage.get(guildId, StelleKeys.Player);
        if (cached) return {
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
     * @param guildId
     * @param locale
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

        this.storage.set(guildId, StelleKeys.Locale, {
            id: guildId,
            locale,
        });
    }

    /**
     *
     * Set the guild prefix to the database.
     * @param guildId
     * @param prefix
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

        this.storage.set(guildId, StelleKeys.Prefix, {
            id: guildId,
            prefix,
        });
    }

    /**
     *
     * Set the guild player to the database.
     * @param param0
     * @returns
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

        this.storage.set(guildId, StelleKeys.Player, {
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
