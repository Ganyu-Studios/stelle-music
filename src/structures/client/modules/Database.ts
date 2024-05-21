import { PrismaClient } from "@prisma/client";
import type { UsingClient } from "seyfert";

const prismaClient = new PrismaClient();

/**
 * Main Stelle database class.
 */
export class StelleDatabase {
    private client: UsingClient;
    private prisma!: PrismaClient;

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
        try {
            await this.prisma.$connect();

            this.connected = true;
            this.client.logger.info("Database - Stelle is now connected to the database.");
        } catch (error) {
            this.client.logger.error(`Database - ${error}`);
        }
    }

    /**
     *
     * Get the guild locale from the database.
     * @param guildId
     * @returns
     */
    public async getLocale(guildId: string): Promise<string> {
        const data = await this.prisma.guildLocale.findUnique({ where: { id: guildId } });
        return data?.locale ?? this.client.config.defaultLocale;
    }
}
