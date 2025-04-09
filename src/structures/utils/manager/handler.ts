import type { UsingClient } from "seyfert";
import type { LavalinkEvents } from "#stelle/types";
import type { Lavalink } from "./events.js";

import { pathToFileURL } from "node:url";
import { BaseHandler } from "seyfert/lib/common/index.js";

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
    readonly values: Map<string, Lavalink> = new Map<string, Lavalink>();

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
        const directory = await this.client.getRC().then((x) => x.locations.lavalink);
        const files = await this.loadFilesK<{ default: Lavalink }>(await this.getFiles(directory));

        for (const file of files) {
            const event: Lavalink = file.file.default;
            if (!event) {
                this.logger.warn(`${file.name} doesn't export by \`export default new Lavaink({ ... })\``);
                continue;
            }

            if (!event.name) {
                this.logger.warn(`${file.name} doesn't have a \`name\``);
                continue;
            }

            if (typeof event.run !== "function") {
                this.logger.warn(`${file.name} doesn't have a \`run\` function`);
                continue;
            }

            const run = (...args: Parameters<LavalinkEvents[keyof LavalinkEvents]>) => event.run(this.client, ...args);

            event.filepath = file.path;

            if (event.isNode()) this.client.manager.nodeManager.on(event.name, run);
            else if (event.isManager()) this.client.manager.on(event.name, run);

            this.values.set(event.name, event);
        }
    }

    /**
     * Reload a specific event.
     * @param {keyof LavalinkEvents} name The event name.
     * @returns {Promise<void>} Boo! A promise.
     */
    public async reload(name: keyof LavalinkEvents): Promise<void> {
        const event: Lavalink | undefined = this.values.get(name);
        if (!event?.filepath) return;

        // i hate this so much, but it's the only way to make it work.
        const newEvent: Lavalink = await import(`${pathToFileURL(event.filepath)}?update=${Date.now()}`).then((x) => x.default ?? x);
        if (!newEvent) return;

        newEvent.filepath = event.filepath;

        const run = (...args: Parameters<LavalinkEvents[keyof LavalinkEvents]>) => newEvent.run(this.client, ...args);

        if (newEvent.isNode()) this.client.manager.nodeManager.on(newEvent.name, run);
        else if (newEvent.isManager()) this.client.manager.on(newEvent.name, run);

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
        // don't ask... just don't ask.
        this.client.manager.removeAllListeners();
        this.client.manager.nodeManager.removeAllListeners();

        for (const event of this.values.values()) {
            await this.reload(event.name);
        }
    }
}
