import type { UsingClient } from "seyfert";

/**
 * The storage contract for one Stelle cache collection.
 *
 * Implementations must:
 * - Keep `undefined` and `null` apart: `undefined` means that a key has not been cached, while `null` is a valid cached
 *   value used for negative caches ("read and known absent").
 * - Persist values only through `set`. Callers never mutate a value read with `get` to update it, and a backend that
 *   hands out copies (e.g. one that serializes) must not need them to.
 * - Return values as they were stored. A serializing backend must keep non-JSON types such as `Date` intact.
 * - Keep the collection isolated by its `namespace`: `clear` must only remove this collection's keys, even when
 *   several collections share one store.
 *
 * `cacheAdapterContract` (`tests/helpers/cache-adapter-contract.ts`) checks all of the above; run it against a custom
 * adapter to validate it.
 * @template T The collection value type.
 */
export interface CacheAdapter<T> {
    /**
     * Get a cached value.
     * @param {string} key The cache key.
     * @returns {Awaitable<T | undefined>} The cached value, or undefined on a cache miss.
     */
    get(key: string): Awaitable<T | undefined>;
    /**
     * Store a value.
     * @param {string} key The cache key.
     * @param {T} value The value to cache.
     * @returns {Awaitable<this>} The adapter instance.
     */
    set(key: string, value: T): Awaitable<this>;
    /**
     * Remove a value.
     * @param {string} key The cache key.
     * @returns {Awaitable<boolean>} Whether a value was removed.
     */
    delete(key: string): Awaitable<boolean>;
    /**
     * Check whether a key is cached.
     * @param {string} key The cache key.
     * @returns {Awaitable<boolean>} Whether the key exists.
     */
    has(key: string): Awaitable<boolean>;
    /**
     * Remove all values from this collection.
     * @returns {Awaitable<void>}
     */
    clear(): Awaitable<void>;
}
/**
 * A value that an adapter may provide immediately or asynchronously.
 * @template T The resolved value type.
 */
export type Awaitable<T> = T | PromiseLike<T>;

/**
 * Options shared by cache adapter factories.
 */
export interface CacheAdapterOptions {
    /**
     * Maximum number of entries for bounded adapters.
     * @type {number}
     */
    limit: number;
    /**
     * Expiration time in milliseconds.
     * @type {number}
     */
    expire: number;
    /**
     * Namespace for the collection.
     * @type {string}
     */
    namespace: string;
}

/**
 * Creates a typed cache adapter for one collection. Called once per collection, so each gets its own adapter and
 * `namespace`. Set one as the config's `cache.adapter` to plug in a custom backend; the client gives it access to the
 * bot's existing connections (e.g. `client.redis`).
 *
 * Keep the factory generic, so every collection keeps its own value type:
 * ```ts
 * adapter: <T>(options, client) => new MyCacheAdapter<T>(options, client),
 * ```
 * @template T The collection value type.
 */
export type CacheAdapterFactory = <T>(options: CacheAdapterOptions, client: UsingClient) => CacheAdapter<T>;

/**
 * A {@link CacheAdapterFactory} already bound to the client: what {@link Cache} calls once per collection.
 * @template T The collection value type.
 */
export type BoundCacheAdapterFactory = <T>(options: CacheAdapterOptions) => CacheAdapter<T>;
