import { createEvent } from "seyfert";

import { BOT_NAME, BOT_VERSION } from "#stelle/data/Constants.js";
import { changePresence } from "#stelle/utils/functions/changePresence.js";

export default createEvent({
    data: { name: "botReady", once: true },
    run: async (user, client): Promise<void> => {
        client.readyTimestamp = Date.now();

        const clientName = `${BOT_NAME} v${BOT_VERSION}`;

        client.logger.info(`API - Logged in as: ${user.username}`);
        client.logger.info(`Client - ${clientName} is now ready.`);

        await client.database.connect();
        await changePresence(client);
    },
});
