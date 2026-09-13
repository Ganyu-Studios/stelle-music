import type { UsingClient } from "seyfert";
import { PrismaClient } from "#stelle/prisma";
import type { ModelNames } from "./Controller.js";

/**
 * Owns the Prisma client and its connection lifecycle. Replaces the module-global client so the instance, its
 * connection state and connect/disconnect all live in one place, injected into every controller instead of reached for
 * through the {@link StelleDatabase} aggregator.
 * @class PrismaService
 */
export class PrismaService {
    /**
     * The Prisma client instance.
     * @type {PrismaClient}
     * @readonly
     */
    public readonly instance: PrismaClient = new PrismaClient();

    /**
     * The client instance, used for connection logging.
     * @type {UsingClient}
     * @readonly
     */
    public readonly client: UsingClient;

    /**
     * Indicates whether the database is connected.
     * @type {boolean}
     * @default false
     */
    public connected: boolean = false;

    /**
     * Creates an instance of the PrismaService class.
     * @param {UsingClient} client The client instance.
     */
    constructor(client: UsingClient) {
        this.client = client;
    }

    /**
     * Resolve a Prisma model delegate by name.
     * @template M
     * @param {M} name The model name.
     * @returns {PrismaClient[M]} The model delegate.
     */
    public model<M extends ModelNames>(name: M): PrismaClient[M] {
        return this.instance[name];
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
        await this.instance
            .$connect()
            .then(() => {
                this.connected = true;
                this.client.logger.info("[Database] Connected");
            })
            .catch((error) => this.client.logger.error(`[Database] Connection failed | error: ${error}`));
    }

    /**
     * Disconnect from the database.
     * @returns {Promise<void>} A promise that returns nothing, yay!
     */
    public async disconnect(): Promise<void> {
        await this.instance
            .$disconnect()
            .then(() => {
                this.connected = false;
                this.client.logger.info("[Database] Disconnected");
            })
            .catch((error) => this.client.logger.error(`[Database] Disconnection failed | error: ${error}`));
    }
}
