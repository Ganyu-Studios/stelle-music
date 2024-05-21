import type { AllEvents, KazagumoEvents, LavalinkEvent, LavalinkEventRun, LavalinkEventType, ShoukakuEvents } from "#stelle/types";

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
    public isShoukaku(): this is LavalinkShoukaku {
        return this.type === "shoukaku";
    }

    /**
     *
     * Check if the event is a `kazagumo` event.
     * @returns
     */
    public isKazagumo(): this is LavalinkKazagumo {
        return this.type === "kazagumo";
    }
}

type LavalinkShoukaku = Lavalink<keyof ShoukakuEvents>;
type LavalinkKazagumo = Lavalink<keyof KazagumoEvents>;
