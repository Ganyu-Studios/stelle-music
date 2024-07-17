import type { LavalinkManagerEvents, NodeManagerEvents } from "lavalink-client";
import type { AllEvents, LavalinkEvent, LavalinkEventRun, LavalinkEventType } from "#stelle/types";

/**
 * Stelle Lavalink events main class.
 */
export class Lavalink<K extends keyof AllEvents = keyof AllEvents> implements LavalinkEvent<K> {
    readonly name: K;
    readonly type: LavalinkEventType<K>;
    readonly run: LavalinkEventRun<K>;

    /**
     *
     * Create a new lavalink event.
     * @param event
     */
    constructor(event: LavalinkEvent<K>) {
        this.name = event.name;
        this.type = event.type;
        this.run = event.run;
    }

    /**
     *
     * Check if the event is a `shoukaku` event.
     * @returns
     */
    public isNode(): this is LavalinkNode {
        return this.type === "node";
    }

    /**
     *
     * Check if the event is a `kazagumo` event.
     * @returns
     */
    public isManager(): this is LavalinkManager {
        return this.type === "manager";
    }
}

type LavalinkNode = Lavalink<keyof NodeManagerEvents>;
type LavalinkManager = Lavalink<keyof LavalinkManagerEvents>;
