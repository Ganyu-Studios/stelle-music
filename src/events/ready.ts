import { join } from "node:path";
import { createEvent } from "seyfert";
import { Constants } from "#stelle/utils/data/constants.js";
import { changePresence } from "#stelle/utils/functions/internal/presence.js";

export default createEvent({
    data: { name: "ready", once: true },
    async run(user, client, shardId): Promise<void> {
        client.readyTimestamp = Date.now();

        const clientName = `${user.username} v${Constants.Version}`;
        const cachePath = join(Constants.CachePath, Constants.CommandsFile);

        client.logger.info(`[API] Logged in | user: ${user.username}`);
        client.logger.info(`[Client] Ready | name: ${clientName} | shard: ${shardId}`);

        changePresence(client);

        await client.database.connect();

        await client.uploadCommands({ cachePath });
        await client.manager.init({ id: user.id, username: clientName });
    },
});
