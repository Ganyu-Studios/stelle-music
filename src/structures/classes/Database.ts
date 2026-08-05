import type { UsingClient } from "seyfert";
import { LocaleController } from "#stelle/controllers/locale.js";
import { PlayerController } from "#stelle/controllers/player.js";
import { PlaylistController } from "#stelle/controllers/playlist.js";
import { PrefixController } from "#stelle/controllers/prefix.js";
import { RequestsController } from "#stelle/controllers/requests.js";
import type { PrismaClient } from "#stelle/prisma";
import { Cache } from "./Cache.js";
import { PrismaService } from "./PrismaService.js";

/**
 * Class representing the database.
 *
 * A thin aggregator: it owns the {@link PrismaService} and {@link Cache}, wires them into every controller, and
 * delegates the connection lifecycle. Consumers keep using `client.database.<controller>` unchanged.
 * @class StelleDatabase
 */
export class StelleDatabase {
    /**
     * The Prisma service, owning the client and its connection lifecycle.
     * @type {PrismaService}
     * @readonly
     */
    readonly prisma: PrismaService;

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
     * The request-channel controller.
     * @type {RequestsController}
     * @readonly
     */
    public readonly requests: RequestsController;

    /**
     * Creates an instance of the Database class.
     * @param {UsingClient} client The client instance.
     */
    constructor(client: UsingClient) {
        this.client = client;
        this.prisma = new PrismaService(client);

        this.locales = new LocaleController(this.prisma, this.cache, client);
        this.prefixes = new PrefixController(this.prisma, this.cache, client);
        this.players = new PlayerController(this.prisma, this.cache, client);
        this.playlist = new PlaylistController(this.prisma, this.cache, client);
        this.requests = new RequestsController(this.prisma, this.cache, client);
    }

    /**
     * The raw Prisma client. Delegates to {@link PrismaService}; kept for callers reading `database.instance`.
     * @type {PrismaClient}
     * @readonly
     */
    public get instance(): PrismaClient {
        return this.prisma.instance;
    }

    /**
     * Indicates whether the database is connected.
     * @type {boolean}
     * @readonly
     */
    public get connected(): boolean {
        return this.prisma.connected;
    }

    /**
     * Get the database connection status.
     * @returns {boolean} The connection status.
     */
    public isConnected(): boolean {
        return this.prisma.isConnected();
    }

    /**
     * Connect to the database.
     * @returns {Promise<void>} A promise that returns nothing, yay!
     */
    public connect(): Promise<void> {
        return this.prisma.connect();
    }

    /**
     * Disconnect from the database.
     * @returns {Promise<void>} A promise that returns nothing, yay!
     */
    public disconnect(): Promise<void> {
        return this.prisma.disconnect();
    }
}
