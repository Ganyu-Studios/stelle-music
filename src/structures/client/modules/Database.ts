import { PrismaClient } from "@prisma/client";
import type { UsingClient } from "seyfert";

const prismaClient = new PrismaClient();

export class StelleDatabase {
    private client: UsingClient;
    private prisma!: PrismaClient;

    public connected: boolean = false;

    constructor(client: UsingClient) {
        this.client = client;
        Object.defineProperty(this, "prisma", {
            get: () => prismaClient,
        });
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
        const data = await this.prisma.guildLocale.findUnique({ where: { guildId } });
        return data?.locale ?? this.client.config.defaultLocale;
    }
}
