import type { UsingClient } from "seyfert";
import { LocaleController } from "#stelle/controllers/locale.js";
import { PlayerController } from "#stelle/controllers/player.js";
import { PlaylistController } from "#stelle/controllers/playlist.js";
import { PrefixController } from "#stelle/controllers/prefix.js";
import { PrismaClient } from "#stelle/prisma";
import { Cache } from "./Cache.js";

// cuz prisma do weird stuff
const prismaClient = new PrismaClient();

/**
 * Class representing the database.
 * @class StelleDatabase
 */
export class StelleDatabase {
    /**
     * The database client instance.
     * @type {PrismaClient}
     * @readonly
     */
    readonly prisma: PrismaClient = prismaClient;

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
     */
    readonly client: UsingClient;

    /**
     * The locale controller.
     * @type {LocaleController}
     * @readonly
     */
    public readonly locales: LocaleController;

    /**
     * The prefix controller.
     * @type {PrefixController}
     * @readonly
     */
    public readonly prefixes: PrefixController;

    /**
     * The player controller.
     * @type {PlayerController}
     * @readonly
     */
    public readonly players: PlayerController;

    /**
     * The playlist controller.
     * @type {PlaylistController}
     * @readonly
     */
    public readonly playlist: PlaylistController;

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

        this.locales = new LocaleController(this);
        this.prefixes = new PrefixController(this);
        this.players = new PlayerController(this);
        this.playlist = new PlaylistController(this);
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
                this.client.logger.info("[Database] Connected");
            })
            .catch((error) => this.client.logger.error(`[Database] Connection failed | error: ${error}`));
    }

    /**
     * Disconnect from the database.
     * @returns {Promise<void>} A promise that returns nothing, yay!
     */
    public async disconnect(): Promise<void> {
        await this.prisma
            .$disconnect()
            .then(() => {
                this.connected = false;
                this.client.logger.info("[Database] Disconnected");
            })
            .catch((error) => this.client.logger.error(`[Database] Disconnection failed | error: ${error}`));
    }
}
