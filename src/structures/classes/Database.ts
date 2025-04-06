import type { UsingClient } from "seyfert";
import type { LocaleString } from "seyfert/lib/types/index.js";

import { PrismaClient } from "@prisma/client";

// cuz prisma do weird stuff
const prismaClient = new PrismaClient();

/**
 * Class representing the database.
 * @class Database
 */
export class Database {
    /**
     * The database client instance.
     * @type {PrismaClient}
     * @readonly
     */
    protected prisma: PrismaClient = prismaClient;

    /**
     * The client instance.
     * @type {UsingClient}
     * @readonly
     */
    protected client: UsingClient;

    /**
     * Indicates whether the database is connected.
     * @type {boolean}
     * @default false
     */
    public connected: boolean = false;

    /**
     * Creates an instance of the Database class.
     * @param {UsingClient} client - The client instance.
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
        const data = await this.prisma.guildLocale.findUnique({ where: { id } });
        return (data?.locale as LocaleString | undefined) ?? this.client.config.defaultLocale;
    }

    /**
     *
     * Get the guild prefix from the database.
     * @param {string} id The guild id.
     * @returns {Promise<string>} The prefix of the guild.
     */
    public async getPrefix(id: string): Promise<string> {
        const data = await this.prisma.guildPrefix.findUnique({ where: { id } });
        return data?.prefix ?? this.client.config.commands.defaultPrefix;
    }

    /**
     *
     * Set the guild locale to the database.
     * @param {string} id The guild id.
     * @param {string} locale The locale to set.
     * @returns {Promise<void>} A magic promise, you see it?
     */
    public async setLocale(id: string, locale: string): Promise<void> {
        await this.prisma.guildLocale.upsert({
            where: { id },
            update: { locale },
            create: {
                id,
                locale,
            },
        });
    }

    /**
     *
     * Set the guild prefix to the database.
     * @param {string} id The guild id.
     * @param {string} prefix The prefix to set.
     * @returns {Promise<void>} A promise since we love promises.
     */
    public async setPrefix(id: string, prefix: string): Promise<void> {
        await this.prisma.guildPrefix.upsert({
            where: { id },
            update: { prefix },
            create: {
                id,
                prefix,
            },
        });
    }
}
