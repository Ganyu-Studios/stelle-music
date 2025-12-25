import type { UsingClient } from "seyfert";
import type { Prisma, PrismaClient } from "#stelle/prisma";
import type { Cache } from "./Cache.js";
import type { StelleDatabase } from "./Database.js";

/**
 * The model names type.
 */
type ModelNames = Prisma.ModelName;

/**
 * Class representing a controller for a specific model.
 * @template M The model name.
 * @abstract
 * @class Controller
 */
export abstract class Controller<M extends ModelNames> {
    /**
     * The Prisma client instance.
     * @type {PrismaClient}
     * @readonly
     * @protected
     */
    protected readonly prisma: PrismaClient;

    /**
     * The cache instance.
     * @type {Cache}
     * @readonly
     * @protected
     */
    protected readonly cache: Cache;

    /**
     * The client instance for config access.
     * @type {UsingClient}
     * @readonly
     * @protected
     */
    protected readonly client: UsingClient;

    /**
     * Create a controller instance.
     * @param {StelleDatabase} database The database instance.
     */
    public constructor(database: StelleDatabase) {
        this.prisma = database.prisma;
        this.cache = database.cache;
        this.client = database.client;
    }

    /**
     * The name of the model.
     * @type {M}
     * @readonly
     * @abstract
     * @protected
     */
    protected abstract readonly modelName: M;

    /**
     * The Prisma model instance.
     * @type {PrismaClient[M]}
     * @readonly
     * @protected
     */
    protected get model(): PrismaClient[M] {
        return this.prisma[this.modelName];
    }
}
