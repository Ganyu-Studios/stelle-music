import type { UsingClient } from "seyfert";

import { BaseHandler } from "seyfert/lib/common/index.js";

import type { Lavalink } from "./Lavalink.js";

/**
 * Main Stelle music handler.
 */
export class StelleHandler extends BaseHandler {
    /**
     * The client instance.
     */
    readonly client: UsingClient;

    /**
     *
     * Create a new instance of the handler.
     * @param client The client.
     */
    constructor(client: UsingClient) {
        super(client.logger);
        this.client = client;
    }

    /**
     * Load the handler.
     */
    public async load() {
        const files = await this.loadFilesK<{ default: Lavalink }>(
            await this.getFiles(await this.client.getRC().then((x) => x.locations.lavalink))
        );

        for (const file of files) {
            const path = file.path.split(process.cwd()).slice(1).join(process.cwd());
            const event = file.file.default as undefined | Lavalink;

            if (!event) {
                this.logger.warn(`${path} doesn't export by \`export default new Lavaink({ ... })\``);
                continue;
            }

            if (!("name" in event)) {
                this.logger.warn(`${path} doesn't have a \`name\``);
                continue;
            }

            if (typeof event.run !== "function") {
                this.logger.warn(`${path} doesn't have a \`run\` function`);
                continue;
            }

            const run = (...args: any) => event.run(this.client, ...args) as unknown;

            if (event.isNode()) {
                this.client.manager.nodeManager.on(event.name, run);
            } else if (event.isManager()) {
                this.client.manager.on(event.name, run);
            }
        }
    }

    /**
     *
     * Reload all `lavalink-client` events.
     * @returns
     */
    // Well,.. this is weird, but works.
    reloadAll(): Promise<void> {
        this.client.manager.removeAllListeners();
        this.client.manager.nodeManager.removeAllListeners();
        return this.load();
    }
}
