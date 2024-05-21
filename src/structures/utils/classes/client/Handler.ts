import type { UsingClient } from "seyfert";
import { BaseHandler } from "seyfert/lib/common/index.js";

import type { Lavalink } from "./Lavalink.js";
import { join } from "node:path";

export class StelleHandler extends BaseHandler {
    readonly client: UsingClient;

    constructor(client: UsingClient) {
        super(client.logger);
        this.client = client;
    }
    public async load() {
        const eventsDir = `${join(process.cwd(), "dist", "lavalink")}`;
        const files = await this.loadFilesK<Lavalink>(await this.getFiles(eventsDir));

        for await (const eventFile of files) {
            const eventPath = eventFile.path.split(process.cwd()).slice(1).join(process.cwd());
            const event: Lavalink<any> = eventFile.file;

            if (!event) {
                this.logger.warn(`${eventPath} doesn't export the class by \`export default ...\``);
                continue;
            }

            if (!event.name) {
                this.logger.warn(`${eventPath} doesn't have a \`name\``);
                continue;
            }

            const run = (...args: any[]) => event.run(this.client, ...args);

            if (event.isShoukaku()) this.client.manager.shoukaku.on(event.name, run);
            else if (event.isKazagumo()) this.client.manager.on(event.name, run);
        }
    }

    //well,.. this is weird, but works.
    async reloadAll(): Promise<void> {
        this.client.manager.removeAllListeners();
        this.client.manager.shoukaku.removeAllListeners();
        return await this.load();
    }
}
