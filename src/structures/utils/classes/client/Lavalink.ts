import type { LavalinkManagerEvents, NodeManagerEvents } from "lavalink-client";
import {
    type AllLavalinkEvents,
    type LavalinkEvent,
    type LavalinkEventRun,
    type LavalinkEventType,
    LavalinkEventTypes,
} from "#stelle/types";

/**
 * Stelle Lavalink events main class.
 */
export class Lavalink<K extends keyof AllLavalinkEvents = keyof AllLavalinkEvents> implements LavalinkEvent<K> {
    /**
     * The event name.
     */
    readonly name: K;
    /**
     * The event type.
     */
    readonly type: LavalinkEventType<K>;
    /**
     * The event run function.
     */
    readonly run: LavalinkEventRun<K>;

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

type LavalinkNode = Lavalink<keyof NodeManagerEvents>;
type LavalinkManager = Lavalink<keyof LavalinkManagerEvents>;
