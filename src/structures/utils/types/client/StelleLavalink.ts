import type { LavalinkManagerEvents, NodeManagerEvents } from "lavalink-client";
import type { Awaitable } from "seyfert/lib/common/index.js";
import type { UsingClient } from "seyfert";

/**
 * All lavalink events.
 */
export type AllEvents = LavalinkManagerEvents & NodeManagerEvents;

/**
 * Lavalink event run function.
 */
export type LavalinkEventRun<K extends keyof AllEvents> = (client: UsingClient, ...args: Parameters<AllEvents[K]>) => Awaitable<any>;

/**
 * Lavalink event type.
 */
export type LavalinkEventType<K extends keyof AllEvents> = K extends keyof NodeManagerEvents ? "node" : "manager";

/**
 * Lavalink event interface.
 */
export interface LavalinkEvent<K extends keyof AllEvents> {
    /** The event type. */
    type: LavalinkEventType<K>;
    /** The event run. */
    run: LavalinkEventRun<K>;
    /** The event name. */
    name: K;
}
