/**
 * The storage contract for one Stelle cache collection.
 *
 * `undefined` means that a key has not been cached. `null` is a valid cached value and is used for negative caches.
 * Implementations must preserve that distinction.
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
 * Creates a typed cache adapter for one collection.
 * @template T The collection value type.
 */
export type CacheAdapterFactory = <T>(options: CacheAdapterOptions) => CacheAdapter<T>;
