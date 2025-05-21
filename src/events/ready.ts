import { createEvent } from "seyfert";
import { Constants } from "#stelle/utils/data/constants.js";
import { changePresence } from "#stelle/utils/functions/presence.js";

export default createEvent({
    data: { name: "ready", once: true },
    async run(user, client, shardId): Promise<void> {
        client.readyTimestamp = Date.now();

        const clientName = `${user.username} v${Constants.Version}`;

        client.logger.info(`API - Logged in as: ${user.username}`);
        client.logger.info(`Client - ${clientName} is now ready on shard #${shardId}.`);

        changePresence(client);

        await client.database.connect();

        await client.uploadCommands({ cachePath: client.config.fileName });
        await client.manager.init({ id: user.id, username: clientName });
    },
});
