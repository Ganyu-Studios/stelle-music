import type { HoshimiEvents } from "hoshimi";
import type { UsingClient } from "seyfert";
import { BaseHandler } from "seyfert/lib/common/index.js";
import { customImport } from "../functions/internal/utils.js";
import type { Lavalink } from "./events.js";

/**
 * The event parameters of the lavalink events.
 */
type LavalinkEventParameters = HoshimiEvents[keyof HoshimiEvents];

/**
 * The event names of the lavalink events.
 */
type LavalinkEventNames = keyof HoshimiEvents;

/**
 * Class representing the lavalink handler.
 * @extends BaseHandler
 * @class LavalinkHandler
 */
export class LavalinkHandler extends BaseHandler {
    override filter: (path: string) => boolean = (path: string) => path.endsWith(".ts") || path.endsWith(".js");

    /**
     * The lavalink events collection.
     * @type {Map<string, Lavalink>}
     */
    readonly values: Map<LavalinkEventNames, Lavalink> = new Map<LavalinkEventNames, Lavalink>();

    /**
     * The client instance.
     * @type {UsingClient}
     */
    readonly client: UsingClient;

    /**
     * Creates an instance of the lavalin handler.
     * @param {UsingClient} client The client instance.
     */
    constructor(client: UsingClient) {
        super(client.logger);
        this.client = client;
    }

    /**
     * Load the handler.
     * @returns {Promise<void>} tip: don't take this comments too seriously.
     */
    public async load(): Promise<void> {
        const files = await this.loadFilesK<{ default: Lavalink }>(
            await this.getFiles(await this.client.getRC().then((x) => x.locations.lavalink)),
        );

        for (const file of files) {
            const event: Lavalink = file.file.default;
            if (!event) {
                this.logger.warn(`[Handler] Invalid event export | file: ${file.name} | expected: export default new Lavaink({ ... })`);
                continue;
            }

            if (!event.name) {
                this.logger.warn(`[Handler] Missing event name | file: ${file.name}`);
                continue;
            }

            if (typeof event.run !== "function") {
                this.logger.warn(`[Handler] Missing event run function | file: ${file.name}`);
                continue;
            }

            const run = (...args: LavalinkEventParameters) => event.run(this.client, ...args);

            event.filepath = file.path;

            if (event.once) this.client.manager.once(event.name, run);
            else this.client.manager.on(event.name, run);

            this.values.set(event.name, event);
        }
    }

    /**
     * Reload a specific event.
     * @param {LavalinkEventNames} name The event name.
     * @returns {Promise<void>} Boo! A promise.
     */
    public async reload(name: LavalinkEventNames): Promise<void> {
        const oldEvent: Lavalink | undefined = this.values.get(name);
        if (!oldEvent?.filepath) return;

        // don't ask... just... don't ask.
        this.client.manager.removeListener(oldEvent.name, oldEvent.run as never);
        // i hate this so much, but it's the only way to make it work.
        const newEvent: Lavalink = await customImport<Lavalink>(oldEvent.filepath);
        if (!newEvent) return;

        newEvent.filepath = oldEvent.filepath;

        const run = (...args: LavalinkEventParameters) => newEvent.run(this.client, ...args);

        if (newEvent.once) this.client.manager.once(newEvent.name, run);
        else this.client.manager.on(newEvent.name, run);

        this.values.set(newEvent.name, newEvent);
    }

    /**
     *
     * Reload all manager events.
     * @returns {Promise<void>} A promise? Now that's a surprise.
     */
    // this is intented to be used in development only, because
    // increments the memory usage of the bot... but meh.
    async reloadAll(): Promise<void> {
        for (const event of this.values.keys()) {
            await this.reload(event);
        }
    }
}
