import type { HoshimiEvents } from "hoshimi";
import type { UsingClient } from "seyfert";
import type { Awaitable } from "seyfert/lib/common/index.js";

/**
 * The interface of the lavalink event.
 */
export interface LavalinkEvent<K extends keyof HoshimiEvents> {
    /**
     * The event name.
     * @type {K}
     */
    name: K;
    /**
     * The event run callback.
     * @type {LavalinkEventRun<K>}
     */
    run: LavalinkEventRun<K>;
    /**
     * The event once property.
     * @type {boolean}
     * @default false
     */
    once?: boolean;
}

/**
 * The interface of the lavalink event run function.
 */
export type LavalinkEventRun<K extends keyof HoshimiEvents> = (client: UsingClient, ...args: HoshimiEvents[K]) => Awaitable<any>;
