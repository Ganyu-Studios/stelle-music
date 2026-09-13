import type { HoshimiEvents } from "hoshimi";
import type { LavalinkEvent, LavalinkEventRun } from "#stelle/types";

/**
 * Class representing a lavalink event.
 * @class Lavalink
 * @implements {LavalinkEvent}
 */
export class Lavalink<K extends keyof HoshimiEvents = keyof HoshimiEvents> implements LavalinkEvent<K> {
    /**
     * The file path of the event.
     * @type {string}
     * @readonly
     */
    public filepath?: string;

    /**
     * The event name.
     * @type {K}
     * @readonly
     */
    readonly name: K;

    /**
     * The event run function.
     * @type {LavalinkEventRun<K>}
     * @readonly
     */
    readonly run: LavalinkEventRun<K>;

    /**
     * The event once property.
     * @type {boolean}
     * @readonly
     * @default false
     */
    readonly once: boolean = false;

    /**
     *
     * Create a new lavalink event.
     * @param event The event.
     */
    constructor(event: LavalinkEvent<K>) {
        this.name = event.name;
        this.run = event.run;
    }
}

/**
 *
 * Create a new lavalink event.
 * @param {LavalinkEvent<K>} event The event to create.
 * @returns {Lavalink<K>} The created event.
 */
// just to follow the same way to create a event provided by seyfert.
export const createLavalinkEvent = <K extends keyof HoshimiEvents>(event: LavalinkEvent<K>): LavalinkEvent<K> => new Lavalink<K>(event);
