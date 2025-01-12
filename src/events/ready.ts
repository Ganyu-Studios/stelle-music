import { createEvent } from "seyfert";

import { BOT_VERSION } from "#stelle/data/Constants.js";
import { changePresence } from "#stelle/utils/functions/presence.js";

export default createEvent({
    data: { name: "botReady", once: true },
    async run(user, client): Promise<void> {
        client.readyTimestamp = new Date();

        const clientName = `${user.username} v${BOT_VERSION}`;

        client.logger.info(`API - Logged in as: ${user.username}`);
        client.logger.info(`Client - ${clientName} is now ready.`);

        await client.database.connect();
        await client.manager.init({ id: user.id, username: clientName });
        await client.uploadCommands({ cachePath: client.config.cache.filename });

        changePresence(client);
    },
});
