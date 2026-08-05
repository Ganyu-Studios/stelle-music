import type { UsingClient } from "seyfert";
import type { Prisma, PrismaClient } from "#stelle/prisma";
import type { Cache } from "./Cache.js";
import type { PrismaService } from "./PrismaService.js";

/**
 * The model names type.
 */
export type ModelNames = Prisma.ModelName;

/**
 * Swallow only Prisma's "record not found" (`P2025`) rejection and rethrow anything else. Shared by the delete/update
 * paths that treat an already-gone row as a no-op but must not mask connection errors, timeouts or constraint failures
 * as a silent success.
 * @param {unknown} error The rejection to inspect.
 * @returns {null} Null when the error is a `P2025` miss.
 * @throws Rethrows any non-`P2025` error.
 */
export function rethrowUnlessMissing(error: unknown): null {
    if ((error as { code?: string } | null)?.code === "P2025") return null;
    throw error;
}

/**
 * Options for a cache-first read (`cacheGet`).
 * @template T The record type.
 */
export interface CacheGetOptions<T> {
    /** Read the record from the cache: `undefined` is a miss, `null` is a negatively-cached "known absent". */
    read: () => T | null | undefined;
    /** Write a freshly read record (or `null`, to negatively cache an absent record) to the cache. */
    write: (data: T | null) => void;
    /** The database read to run on a cache miss. */
    query: () => Promise<T | null>;
    /** Whether to return a structured clone (for records callers mutate in place). */
    clone?: boolean;
}

/**
 * Options for a cache-backed write (`cacheSet`).
 * @template T The record type.
 */
export interface CacheSetOptions<T> {
    /** Write the written record to the cache. */
    write: (data: T) => void;
    /** The database write to run. */
    query: () => Promise<T>;
}

/**
 * Options for a cache-backed delete (`cacheDelete`).
 */
export interface CacheDeleteOptions {
    /** Evict the record from the cache. */
    evict: () => void;
    /** The database delete to run. */
    query: () => Promise<unknown>;
}

/**
 * Class representing a controller for a specific model.
 * @template M The model name.
 * @abstract
 * @class Controller
 */
export abstract class Controller<M extends ModelNames> {
    /**
     * The Prisma service.
     * @type {PrismaService}
     * @readonly
     * @protected
     */
    protected readonly prisma: PrismaService;

    /**
     * The cache instance.
     * @type {Cache}
     * @readonly
     * @protected
     */
    protected readonly cache: Cache;

    /**
     * The client instance.
     * @type {UsingClient}
     * @readonly
     * @protected
     */
    protected readonly client: UsingClient;

    /**
     * Create a controller instance.
     * @param {PrismaService} prisma The Prisma service.
     * @param {Cache} cache The cache instance.
     * @param {UsingClient} client The client instance.
     */
    public constructor(prisma: PrismaService, cache: Cache, client: UsingClient) {
        this.prisma = prisma;
        this.cache = cache;
        this.client = client;
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
        return this.prisma.model(this.modelName);
    }

    /**
     * Cache-first read: return the cached record via `read`, otherwise run `query`, write its result to the cache via
     * `write` and return it. The accessors keep the (guild-scoped or global) cache addressing in the concrete
     * controller, so the base shares the orchestration without knowing where each record lives. The query result is
     * always written back — including a `null` miss — so accessors backed by a bounded store negatively cache absent
     * records and stop re-querying the database for default-state guilds/users (accessors over an unbounded store
     * simply drop the `null` in their `write`).
     * @template T The record type.
     * @param {CacheGetOptions<T>} options The read/write/query accessors and clone flag.
     * @returns {Promise<T | null>} The cached or freshly read record, or null.
     */
    protected async cacheGet<T>({ read, write, query, clone = false }: CacheGetOptions<T>): Promise<T | null> {
        const cached: T | null | undefined = read();
        if (cached !== undefined) return cached && clone ? structuredClone(cached) : cached;

        const data: T | null = await query();
        write(data);

        return data && clone ? structuredClone(data) : data;
    }

    /**
     * Run a write that returns the record (e.g. an upsert) and write the result to the cache via `write`.
     * @template T The record type.
     * @param {CacheSetOptions<T>} options The write accessor and database write.
     * @returns {Promise<void>} A promise that resolves once the record is cached.
     */
    protected async cacheSet<T>({ write, query }: CacheSetOptions<T>): Promise<void> {
        write(await query());
    }

    /**
     * Run a delete and, on success, evict the record from the cache via `evict`, swallowing only a "record not found"
     * (Prisma `P2025`) rejection and rethrowing anything else. The row is deleted first, then evicted, so a failing
     * delete surfaces instead of leaving the cache and database disagreeing silently.
     * @param {CacheDeleteOptions} options The evict accessor and database delete.
     * @returns {Promise<void>} A promise that resolves once the record is evicted.
     */
    protected async cacheDelete({ evict, query }: CacheDeleteOptions): Promise<void> {
        await query()
            .then((): void => evict())
            .catch(rethrowUnlessMissing);
    }
}
