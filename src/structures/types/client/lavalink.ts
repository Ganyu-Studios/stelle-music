import type { LavalinkManagerEvents, NodeManagerEvents } from "lavalink-client";
import type { UsingClient } from "seyfert";
import type { Awaitable } from "seyfert/lib/common/index.js";

/**
 * The enum of the lavalink event types.
 */
export enum LavalinkEventTypes {
    /**
     * Manager event type.
     * @type {number}
     */
    Manager = 1,
    /**
     * Node event type.
     * @type {number}
     */
    Node = 2,
}

/**
 * The interface of the lavalink event.
 */
export interface LavalinkEvent<K extends keyof LavalinkEvents> {
    /**
     * The event name.
     * @type {K}
     */
    name: K;
    /**
     * The event type.
     * @type {LavalinkEventType<K>}
     */
    type: LavalinkEventType<K>;
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
export type LavalinkEvents = LavalinkManagerEvents & NodeManagerEvents;

/**
 * The interface of the lavalink event run function.
 */
export type LavalinkEventRun<K extends keyof LavalinkEvents> = (
    client: UsingClient,
    ...args: Parameters<LavalinkEvents[K]>
) => Awaitable<any>;

/**
 * The interface of the lavalink event type.
 */
export type LavalinkEventType<K extends keyof LavalinkEvents> = K extends keyof NodeManagerEvents
    ? LavalinkEventTypes.Node
    : LavalinkEventTypes.Manager;
