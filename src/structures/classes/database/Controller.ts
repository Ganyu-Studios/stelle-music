import type { UsingClient } from "seyfert";
import type { PrismaService } from "#stelle/classes/database/PrismaService.js";
import type { Cache } from "#stelle/classes/modules/Cache.js";
import type { Prisma, PrismaClient } from "#stelle/prisma";

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
 * The version of a cache key while reads of it are in flight.
 */
interface KeyVersion {
    /** How many `fetch` queries of the key are in flight. */
    readers: number;
    /** Bumped by every `store`/`remove` of the key that lands while those reads are in flight. */
    version: number;
}

/**
 * Options for a cache-first read (`fetch`).
 * @template T The record type.
 */
export interface FetchOptions<T> {
    /** The cache key the record lives under, shared with the `store`/`remove` calls that write it. */
    key: string;
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
 * Options for a cache-backed write (`store`).
 * @template T The record type.
 */
export interface StoreOptions<T> {
    /** The cache key the record lives under. */
    key: string;
    /** Write the written record to the cache. */
    write: (data: T) => void;
    /** The database write to run. */
    query: () => Promise<T>;
}

/**
 * Options for a cache-backed delete (`remove`).
 */
export interface RemoveOptions {
    /** The cache key the record lives under. */
    key: string;
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
     * The version of each key with a `fetch` query in flight, so a read that started before a write can tell the write
     * landed and skip caching what it read. Only keys being read are tracked: an entry is dropped when its last reader
     * settles, so the map never outgrows the reads in flight.
     * @type {Map<string, KeyVersion>}
     * @readonly
     * @protected
     */
    protected readonly versions: Map<string, KeyVersion> = new Map();

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
     *
     * If a `store`/`remove` of the same key lands while the query is in flight, the query may have read the row from
     * before that write, so writing it back would overwrite the newer cache entry with stale data until it expires.
     * The read is then discarded and retried, which picks up what the write cached (or re-queries after an evict).
     * @template T The record type.
     * @param {FetchOptions<T>} options The key, read/write/query accessors and clone flag.
     * @returns {Promise<T | null>} The cached or freshly read record, or null.
     */
    protected async fetch<T>(options: FetchOptions<T>): Promise<T | null> {
        const { key, read, write, query, clone = false } = options;

        const cached: T | null | undefined = read();
        if (cached !== undefined) {
            if (cached && clone) return structuredClone(cached);
            return cached;
        }

        const entry: KeyVersion = this.versions.get(key) ?? { readers: 0, version: 0 };
        const version: number = entry.version;

        entry.readers++;
        this.versions.set(key, entry);

        let data: T | null;
        try {
            data = await query();
        } finally {
            if (--entry.readers === 0) this.versions.delete(key);
        }

        if (entry.version !== version) return this.fetch(options);

        write(data);

        if (data && clone) return structuredClone(data);
        return data;
    }

    /**
     * Bump the version of a key with reads in flight, so they retry instead of caching what they read (see `fetch`).
     * A key nobody is reading has nothing to invalidate.
     * @param {string} key The cache key that was just written or evicted.
     * @returns {void}
     */
    private bump(key: string): void {
        const entry: KeyVersion | undefined = this.versions.get(key);
        if (entry) entry.version++;
    }

    /**
     * Run a write that returns the record (e.g. an upsert) and write the result to the cache via `write`.
     * @template T The record type.
     * @param {StoreOptions<T>} options The key, write accessor and database write.
     * @returns {Promise<void>} A promise that resolves once the record is cached.
     */
    protected async store<T>({ key, write, query }: StoreOptions<T>): Promise<void> {
        write(await query());
        this.bump(key);
    }

    /**
     * Run a delete and, on success, evict the record from the cache via `evict`, swallowing only a "record not found"
     * (Prisma `P2025`) rejection and rethrowing anything else. The row is deleted first, then evicted, so a failing
     * delete surfaces instead of leaving the cache and database disagreeing silently.
     * @param {RemoveOptions} options The key, evict accessor and database delete.
     * @returns {Promise<void>} A promise that resolves once the record is evicted.
     */
    protected async remove({ key, evict, query }: RemoveOptions): Promise<void> {
        await query()
            .then((): void => {
                evict();
                this.bump(key);
            })
            .catch(rethrowUnlessMissing);
    }
}
