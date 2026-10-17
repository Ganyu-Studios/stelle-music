/**
 * Image timestamp information.
 */
interface ImageTimestamp {
    /**
     * Current progress in milliseconds.
     * @type {number}
     */
    progress: number;
    /**
     * Total duration in milliseconds.
     * @type {number}
     */
    end: number;
    /**
     * Formatted progress string.
     * @type {string}
     */
    progressStart: string;
    /**
     * Formatted end string.
     * @type {string}
     */
    progressEnd: string;
}

/**
 * Image queue information.
 */
interface ImageQueue {
    /**
     * Current track position in the queue.
     * @type {number}
     */
    current: number;
    /**
     * Total number of tracks in the queue.
     * @type {number}
     */
    total: number;
}

/**
 * Image data for rendering.
 */
export interface ImageData {
    /**
     * The name of the track.
     * @type {string}
     */
    name: string;
    /**
     * The artist of the track.
     * @type {string}
     */
    artist: string;
    /**
     * Timestamp information.
     * @type {ImageTimestamp}
     */
    timestamp: ImageTimestamp;
    /**
     * Album artwork URL.
     * @type {string | undefined}
     */
    albumURL: string | undefined;
    /**
     * Queue information.
     * @type {ImageQueue}
     */
    queue: ImageQueue;
    /**
     * Name of the guild.
     * @type {string}
     */
    guildName: string;
}
