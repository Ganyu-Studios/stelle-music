import { BOT_VERSION } from "#stelle/data/Constants.js";
import { createEvent } from "seyfert";

export default createEvent({
    data: { name: "botReady", once: true },
    run: (user, client) => {
        client.readyTimestamp = Date.now();

        const clientName = `${user.username} v${BOT_VERSION}`;

        client.logger.info(`API - Logged in as: ${user.username}`);
        client.logger.info(`Client - ${clientName} is now ready.`);
    },
});
