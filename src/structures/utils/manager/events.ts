import type { LavalinkManagerEvents, NodeManagerEvents } from "lavalink-client";
import { type LavalinkEvent, type LavalinkEventRun, type LavalinkEventType, LavalinkEventTypes, type LavalinkEvents } from "#stelle/types";

/**
 * Class representing a lavalink event.
 * @class Lavalink
 * @implements {LavalinkEvent}
 */
export class Lavalink<K extends keyof LavalinkEvents = keyof LavalinkEvents> implements LavalinkEvent<K> {
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
     * The event type.
     * @type {LavalinkEventType<K>}
     * @readonly
     */
    readonly type: LavalinkEventType<K>;

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
        this.type = event.type;
        this.run = event.run;
    }

    /**
     *
     * Check if the event is a `node` event.
     * @returns {this is LavalinkNode} If the event is a node event.
     */
    public isNode(): this is LavalinkNode {
        return this.type === LavalinkEventTypes.Node;
    }

    /**
     *
     * Check if the event is a `manager` event.
     * @returns {this is LavalinkManager} If the event is a manager event.
     */
    public isManager(): this is LavalinkManager {
        return this.type === LavalinkEventTypes.Manager;
    }
}

/**
 *
 * Create a new lavalink event.
 * @param {LavalinkEvent<K>} event The event to create.
 * @returns {Lavalink<K>} The created event.
 */
// just to follow the same way to create a event provided by seyfert.
export const createLavalinkEvent = <K extends keyof LavalinkEvents>(event: LavalinkEvent<K>): LavalinkEvent<K> => new Lavalink<K>(event);

/**
 * The type of the lavalink node event.
 */
type LavalinkNode = Lavalink<keyof NodeManagerEvents>;

/**
 * The type of the lavalink manager event.
 */
type LavalinkManager = Lavalink<keyof LavalinkManagerEvents>;
