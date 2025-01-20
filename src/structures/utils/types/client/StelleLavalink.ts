import type { LavalinkManagerEvents, NodeManagerEvents } from "lavalink-client";
import type { UsingClient } from "seyfert";
import type { Awaitable } from "seyfert/lib/common/index.js";

/**
 * All lavalink events.
 */
export type AllLavalinkEvents = LavalinkManagerEvents & NodeManagerEvents;

/**
 * Lavalink event run function.
 */
export type LavalinkEventRun<K extends keyof AllLavalinkEvents> = (
    client: UsingClient,
    ...args: Parameters<AllLavalinkEvents[K]>
) => Awaitable<any>;

/**
 * Lavalink event type.
 */
export type LavalinkEventType<K extends keyof AllLavalinkEvents> = K extends keyof NodeManagerEvents ? "node" : "manager";

/**
 * Lavalink event interface.
 */
export interface LavalinkEvent<K extends keyof AllLavalinkEvents> {
    /** The event name. */
    name: K;
    /** The event type. */
    type: LavalinkEventType<K>;
    /** The event run. */
    run: LavalinkEventRun<K>;
}
