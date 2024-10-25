import { BaseHandler } from "seyfert/lib/common/index.js";
import type { Lavalink } from "./Lavalink.js";

import type { UsingClient } from "seyfert";

/**
 * Main Stelle music handler.
 */
export class StelleHandler extends BaseHandler {
    readonly client: UsingClient;

    /**
     *
     * Create a new instance of the handler.
     * @param client
     */
    constructor(client: UsingClient) {
        super(client.logger);
        this.client = client;
    }

    /**
     * Load the handler.
     */
    public async load() {
        //@ts-expect-error yup, seems the types do not want to work. 🐐
        // todo: remove the ts-expect-error when the types are fixed.
        const files = await this.loadFilesK<{ default: Lavalink }>(
            await this.getFiles(await this.client.getRC().then((x) => x.locations.lavalink)),
        );

        for (const file of files) {
            const path = file.path.split(process.cwd()).slice(1).join(process.cwd());
            const event: Lavalink = file.file.default;

            if (!event) {
                this.logger.warn(`${path} doesn't export by \`export default new Lavaink({ ... })\``);
                continue;
            }

            if (!event.name) {
                this.logger.warn(`${path} doesn't have a \`name\``);
                continue;
            }

            if (typeof event.run !== "function") {
                this.logger.warn(`${path} doesn't have a \`run\` function`);
                continue;
            }

            const run = (...args: any) => event.run(this.client, ...args);

            if (event.isNode()) this.client.manager.nodeManager.on(event.name, run);
            else if (event.isManager()) this.client.manager.on(event.name, run);
        }
    }

    /**
     *
     * Reload all `lavalink-client` events.
     * @returns
     */
    //well,.. this is weird, but works.
    reloadAll(): Promise<void> {
        this.client.manager.removeAllListeners();
        this.client.manager.nodeManager.removeAllListeners();
        return this.load();
    }
}
