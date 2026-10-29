import type { FilterSettings, LavalinkPlayerVoice, LavalinkTrack, PlayerEvent } from "hoshimi";

/**
 * The nodelink player structure.
 */
export interface NodelinkPlayer {
    /**
     * The guild id associated with this player.
     * @type {string}
     */
    guildId: string;
    /**
     * The current track playing, null if no track is playing.
     * @type {LavalinkTrack | null}
     */
    track: null;
    /**
     * Whether the player is currently paused.
     * @type {boolean}
     */
    paused: boolean;
    /**
     * The current volume of the player.
     * @type {number}
     */
    volume: number;
}

/**
 * The connection speed metrics for nodelink.
 */
export interface NodelinkConnectionSpeed {
    /**
     * Speed in megabits per second.
     * @type {number}
     */
    mbps: number;
    /**
     * Speed in kilobits per second.
     * @type {number}
     */
    kbps: number;
    /**
     * Speed in bits per second.
     * @type {number}
     */
    bps: number;
}

/**
 * The connection metrics for nodelink.
 */
export interface NodelinkConnectionMetrics {
    /**
     * Timestamp of the metrics.
     * @type {number}
     */
    timestamp: number;
    /**
     * Total bytes downloaded.
     * @type {number}
     */
    downloadedBytes: number;
    /**
     * The duration of the connection in seconds.
     * @type {number}
     */
    durationSeconds: number;
    /**
     * The connection speed metrics.
     * @type {NodelinkConnectionSpeed}
     */
    speed: NodelinkConnectionSpeed;
}

/**
 * The connection metrics for nodelink.
 */
export interface NodelinkConnection {
    /**
     * The current status of the connection.
     * @type {NodelinkConnectionStatus}
     */
    status: NodelinkConnectionStatus;
    /**
     * The connection metrics.
     * @type {NodelinkConnectionMetrics}
     */
    metrics: NodelinkConnectionMetrics;
}

/**
 * The nodelink connection status enum.
 */
export enum NodelinkConnectionStatus {
    /**
     * The connection is good.
     * @type {string}
     */
    Good = "good",
}

/**
 * The nodelink mix end reasons enum.
 */
export enum NodelinkMixEndReasons {
    /**
     * The mix finished normally.
     * @type {string}
     */
    Finished = "FINISHED",
    /**
     * The mix was stopped manually.
     * @type {string}
     */
    Removed = "REMOVED",
    /**
     * An error occurred during the mix.
     * @type {string}
     */
    Error = "ERROR",
    /**
     * A main error occurred.
     * @type {string}
     */
    MainError = "MAIN_ERROR",
}

/**
 * The nodelink event types enum.
 */
export enum NodelinkEventType {
    /**
     * The worker failed event.
     * @type {string}
     */
    WorkerFailed = "WorkerFailedEvent",
    /**
     * The player created event.
     * @type {string}
     */
    PlayerCreated = "PlayerCreatedEvent",
    /**
     * The player destroyed event.
     * @type {string}
     */
    PlayerDestroyed = "PlayerDestroyedEvent",
    /**
     * The player connected event.
     * @type {string}
     */
    PlayerConnected = "PlayerConnectedEvent",
    /**
     * The player reconnecting event.
     * @type {string}
     */
    PlayerReconnecting = "PlayerReconnectingEvent",
    /**
     * The volume changed event.
     * @type {string}
     */
    VolumeChanged = "VolumeChangedEvent",
    /**
     * The filters changed event.
     * @type {string}
     */
    FiltersChanged = "FiltersChangedEvent",
    /**
     * The seek event.
     * @type {string}
     */
    Seek = "SeekEvent",
    /**
     * The pause event.
     * @type {string}
     */
    Pause = "PauseEvent",
    /**
     * The connection status event.
     * @type {string}
     */
    ConnectionStatus = "ConnectionStatusEvent",
    /**
     * The mix started event.
     * @type {string}
     */
    MixStarted = "MixStartedEvent",
    /**
     * The mix ended event.
     * @type {string}
     */
    MixEnded = "MixEndedEvent",
}

/**
 * The nodelink event names enum.
 */
export enum NodelinkEventNames {
    /**
     * The worker failed event name.
     * @type {string}
     */
    WorkerFailed = "nodelinkWorkerFailed",
    /**
     * The player created event name.
     * @type {string}
     */
    PlayerCreated = "nodelinkPlayerCreated",
    /**
     * The player destroyed event name.
     * @type {string}
     */
    PlayerDestroyed = "nodelinkPlayerDestroyed",
    /**
     * The player connected event name.
     * @type {string}
     */
    PlayerConnected = "nodelinkPlayerConnected",
    /**
     * The player reconnecting event name.
     * @type {string}
     */
    PlayerReconnecting = "nodelinkPlayerReconnecting",
    /**
     * The volume changed event name.
     * @type {string}
     */
    VolumeChanged = "nodelinkVolumeChanged",
    /**
     * The filters changed event name.
     * @type {string}
     */
    FiltersChanged = "nodelinkFiltersChanged",
    /**
     * The seek event name.
     * @type {string}
     */
    Seek = "nodelinkSeek",
    /**
     * The pause event name.
     * @type {string}
     */
    Pause = "nodelinkPause",
    /**
     * The connection status event name.
     * @type {string}
     */
    ConnectionStatus = "nodelinkConnectionStatus",
    /**
     * The mix started event name.
     * @type {string}
     */
    MixStarted = "nodelinkMixStarted",
    /**
     * The mix ended event name.
     * @type {string}
     */
    MixEnded = "nodelinkMixEnded",
}

/**
 * The nodelink events interface.
 */
export interface NodelinkEvents {
    /**
     * The worker failed event.
     * @param {WorkerFailedEvent} payload The worker failed event payload.
     */
    nodelinkWorkerFailed: [payload: WorkerFailedEvent];
    /**
     * The player created event.
     * @param {PlayerCreatedEvent} payload The player created event payload.
     */
    nodelinkPlayerCreated: [payload: PlayerCreatedEvent];
    /**
     * The player destroyed event.
     * @param {PlayerDestroyedEvent} payload The player destroyed event payload.
     */
    nodelinkPlayerDestroyed: [payload: PlayerDestroyedEvent];
    /**
     * The player connected event.
     * @param {PlayerConnectedEvent} payload The player connected event payload.
     */
    nodelinkPlayerConnected: [payload: PlayerConnectedEvent];
    /**
     * The player reconnecting event.
     * @param {PlayerReconnectingEvent} payload The player reconnecting event payload.
     */
    nodelinkPlayerReconnecting: [payload: PlayerReconnectingEvent];
    /**
     * The volume changed event.
     * @param {VolumeChangedEvent} payload The volume changed event payload.
     */
    nodelinkVolumeChanged: [payload: VolumeChangedEvent];
    /**
     * The filters changed event.
     * @param {FiltersChangedEvent} payload The filters changed event payload.
     */
    nodelinkFiltersChanged: [payload: FiltersChangedEvent];
    /**
     * The seek event.
     * @param {SeekEvent} payload The seek event payload.
     */
    nodelinkSeek: [payload: SeekEvent];
    /**
     * The pause event.
     * @param {PauseEvent} payload The pause event payload.
     */
    nodelinkPause: [payload: PauseEvent];
    /**
     * The connection status event.
     * @param {ConnectionStatusEvent} payload The connection status event payload.
     */
    nodelinkConnectionStatus: [payload: ConnectionStatusEvent];
    /**
     * The mix started event.
     * @param {MixStartedEvent} payload The mix started event payload.
     */
    nodelinkMixStarted: [payload: MixStartedEvent];
    /**
     * The mix ended event.
     * @param {MixEndedEvent} payload The mix ended event payload.
     */
    nodelinkMixEnded: [payload: MixEndedEvent];
}

/**
 * The worker failed event interface.
 */
export interface WorkerFailedEvent extends Omit<PlayerEvent<NodelinkEventType.WorkerFailed>, "guildId"> {
    /**
     * The affected guilds.
     * @type {string[]}
     */
    affectedGuilds: string[];
    /**
     * The error message.
     * @type {string}
     */
    message: string;
}

/**
 * The player created event interface.
 */
export interface PlayerCreatedEvent extends PlayerEvent<NodelinkEventType.PlayerCreated> {
    /**
     * The created nodelink player.
     * @type {NodelinkPlayer}
     */
    player: NodelinkPlayer;
}

/**
 * The player destroyed event interface.
 */
export interface PlayerDestroyedEvent extends PlayerEvent<NodelinkEventType.PlayerDestroyed> {}

/**
 * The player connected event interface.
 */
export interface PlayerConnectedEvent extends PlayerEvent<NodelinkEventType.PlayerConnected> {
    /**
     * The nodelink voice connection.
     * @type {LavalinkPlayerVoice}
     */
    voice: LavalinkPlayerVoice;
}

/**
 * The player reconnecting event interface.
 */
export interface PlayerReconnectingEvent extends PlayerEvent<NodelinkEventType.PlayerReconnecting> {
    /**
     * The nodelink voice connection.
     * @type {LavalinkPlayerVoice}
     */
    voice: LavalinkPlayerVoice;
}

/**
 * The volume changed event interface.
 */
export interface VolumeChangedEvent extends PlayerEvent<NodelinkEventType.VolumeChanged> {
    /**
     * The new volume.
     * @type {number}
     */
    volume: number;
}

/**
 *
 */
export interface FiltersChangedEvent extends PlayerEvent<NodelinkEventType.FiltersChanged> {
    /**
     * The new filter settings.
     * @type {FilterSettings}
     */
    filters: FilterSettings;
}

/**
 * The seek event interface.
 */
export interface SeekEvent extends PlayerEvent<NodelinkEventType.Seek> {
    /**
     * The new position in milliseconds.
     * @type {number}
     */
    position: number;
}

/**
 * The pause event interface.
 */
export interface PauseEvent extends PlayerEvent<NodelinkEventType.Pause> {
    /**
     * Whether the player is paused.
     * @type {boolean}
     */
    paused: boolean;
}

/**
 * The connection status event interface.
 */
export interface ConnectionStatusEvent extends PlayerEvent<NodelinkEventType.ConnectionStatus> {
    /**
     * The connection metrics.
     * @type {NodelinkConnectionMetrics}
     */
    metrics: NodelinkConnectionMetrics;
}

/**
 * The mix started event interface.
 */
export interface MixStartedEvent extends PlayerEvent<NodelinkEventType.MixStarted> {
    /**
     * The mix identifier.
     * @type {string}
     */
    mixId: string;
    /**
     * The track that started the mix.
     * @type {LavalinkTrack}
     */
    track: LavalinkTrack;
    /**
     * The initial volume of the mix.
     * @type {number}
     */
    volume: number;
}

/**
 * The mix ended event interface.
 */
export interface MixEndedEvent extends PlayerEvent<NodelinkEventType.MixEnded> {
    /**
     * The mix identifier.
     * @type {string}
     */
    mixId: string;
    /**
     * The reason the mix ended.
     * @type {NodelinkMixEndReasons}
     */
    reason: NodelinkMixEndReasons;
}

/**
 * The nodelink lyrics line structure.
 */
export interface NodelinkLyricsLine {
    /**
     * The text of the lyrics line.
     * @type {string}
     */
    text: string;
    /**
     * The time in milliseconds when the line should be displayed, null if unsynced.
     * @type {number | null}
     */
    time: number | null;
    /**
     * The duration in milliseconds the line should be displayed, null if unsynced.
     * @type {number | null}
     */
    duration: number | null;
}

/**
 * The nodelink lyrics result structure.
 */
export interface NodelinkLyricsResult {
    /**
     * Whether the lyrics are synced.
     * @type {boolean}
     */
    synced: boolean;
    /**
     * The language of the lyrics.
     * @type {string}
     */
    lang: string;
    /**
     * The source of the lyrics.
     * @type {string}
     */
    source: string;
    /**
     * The provider of the lyrics.
     * @type {string}
     */
    provider: string;
    /**
     * The lines of the lyrics.
     * @type {NodelinkLyricsLine[]}
     */
    lines: NodelinkLyricsLine[];
}

interface NodelinkLyricsPayload<Type, Data> {
    /**
     * The type of the payload.
     */
    loadType: Type;
    /**
     * The data of the payload.
     */
    data: Data;
}

/**
 * The nodelink lyrics payload structure.
 */
export interface NodelinkLyricsResult extends NodelinkLyricsPayload<"lyrics", NodelinkLyricsResult> {}

/**
 * The nodelink lyrics payload structure for empty results.
 */
export interface NodelinkEmptyLyrics extends NodelinkLyricsPayload<"empty", {}> {}

/**
 * The nodelink lyrics payload structure for errors.
 */
export interface NodelinkErrorLyrics extends NodelinkLyricsPayload<"error", { message: string; severity: "fault" }> {}

/**
 * The nodelink lyrics union type.
 */
export type NodelinkLyrics = NodelinkLyricsResult | NodelinkEmptyLyrics | NodelinkErrorLyrics;

/**
 * The nodelink payload union type.
 */
export type NodelinkPayload =
    | WorkerFailedEvent
    | PlayerCreatedEvent
    | PlayerDestroyedEvent
    | PlayerConnectedEvent
    | PlayerReconnectingEvent
    | VolumeChangedEvent
    | FiltersChangedEvent
    | SeekEvent
    | PauseEvent
    | ConnectionStatusEvent
    | MixStartedEvent
    | MixEndedEvent;
