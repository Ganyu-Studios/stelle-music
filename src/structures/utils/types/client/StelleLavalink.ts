import type { LavalinkManagerEvents, NodeManagerEvents } from "lavalink-client";
import type { UsingClient } from "seyfert";
import type { Awaitable } from "seyfert/lib/common/index.js";

export type AllEvents = LavalinkManagerEvents & NodeManagerEvents;
export type LavalinkEventRun<K extends keyof AllEvents> = (client: UsingClient, ...args: Parameters<AllEvents[K]>) => Awaitable<any>;
export type LavalinkEventType<K extends keyof AllEvents> = K extends keyof NodeManagerEvents ? "node" : "manager";

export interface LavalinkEvent<K extends keyof AllEvents> {
    /** The event name. */
    name: K;
    /** The event type. */
    type: LavalinkEventType<K>;
    /** The event run. */
    run: LavalinkEventRun<K>;
}
