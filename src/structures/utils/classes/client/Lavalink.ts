import type { LavalinkEventType, LavalinkEventRun, LavalinkEvent, AllEvents } from "#stelle/types";
import type { LavalinkManagerEvents, NodeManagerEvents } from "lavalink-client";

/**
 * Stelle Lavalink events main class.
 */
export class Lavalink<K extends keyof AllEvents = keyof AllEvents> implements LavalinkEvent<K> {
    /**
     * The event type.
     */
    readonly type: LavalinkEventType<K>;

    /**
     * The event run function.
     */
    readonly run: LavalinkEventRun<K>;

    /**
     * The event name.
     */
    readonly name: K;

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
     * Check if the event is a `manager` event.
     * @returns
     */
    public isManager(): this is LavalinkManager {
        return this.type === "manager";
    }

    /**
     *
     * Check if the event is a `node` event.
     * @returns
     */
    public isNode(): this is LavalinkNode {
        return this.type === "node";
    }
}

type LavalinkNode = Lavalink<keyof NodeManagerEvents>;
type LavalinkManager = Lavalink<keyof LavalinkManagerEvents>;
