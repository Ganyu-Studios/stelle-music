import type { KazagumoPlayer, KazagumoQueue, KazagumoTrack, PlayerMovedChannels, PlayerMovedState } from "kazagumo";
import type { UsingClient } from "seyfert";
import type { Awaitable } from "seyfert/lib/common/index.js";
import type { PlayerUpdate, TrackExceptionEvent, TrackStuckEvent, WebSocketClosedEvent } from "shoukaku";

//
// yeah, these types are harcoded so don't expect too much.
//

export interface ShoukakuEvents {
    reconnecting: [name: string, reconnectsLeft: number, reconnectInterval: number];
    debug: [name: string, info: string];
    error: [name: string, error: Error];
    ready: [name: string, reconnected: boolean];
    close: [name: string, code: number, reason: string];
    disconnect: [name: string, count: number];
    raw: [name: string, json: unknown];
}

export interface KazagumoEvents {
    playerStart: [player: KazagumoPlayer, track: KazagumoTrack];
    playerResolveError: [player: KazagumoPlayer, track: KazagumoTrack, message?: string];
    playerDestroy: [player: KazagumoPlayer];
    playerCreate: [player: KazagumoPlayer];
    playerEnd: [player: KazagumoPlayer];
    playerEmpty: [player: KazagumoPlayer];
    playerClosed: [player: KazagumoPlayer, data: WebSocketClosedEvent];
    playerStuck: [player: KazagumoPlayer, data: TrackStuckEvent];
    playerResumed: [player: KazagumoPlayer];
    playerMoved: [player: KazagumoPlayer, state: PlayerMovedState, channels: PlayerMovedChannels];
    playerException: [player: KazagumoPlayer, data: TrackExceptionEvent];
    playerUpdate: [player: KazagumoPlayer, data: PlayerUpdate];
    queueUpdate: [player: KazagumoPlayer, queue: KazagumoQueue];
}

export type AllEvents = ShoukakuEvents & KazagumoEvents;
export type LavalinkEventRun<K extends keyof AllEvents> = (client: UsingClient, ...args: AllEvents[K]) => Awaitable<any>;
export type LavalinkEventType<K extends keyof AllEvents> = K extends keyof ShoukakuEvents ? "shoukaku" : "kazagumo";

export interface LavalinkEvent<K extends keyof AllEvents> {
    /** The event name. */
    name: K;
    /** The event type. */
    type: LavalinkEventType<K>;
    /** The event run. */
    run: LavalinkEventRun<K>;
}
