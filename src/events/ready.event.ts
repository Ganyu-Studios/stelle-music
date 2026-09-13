import { createEvent } from "seyfert";
import type { StelleVersion } from "#stelle/types";
import { StelleMeta, StellePaths } from "#stelle/utils/data/constants.js";
import { changePresence } from "#stelle/utils/functions/internal/presence.js";

export default createEvent({
    data: { name: "ready", once: true },
    async run(user, client, shardId): Promise<void> {
        client.readyTimestamp = Date.now();

        const clientName: StelleVersion = `${user.username} v${StelleMeta.Version}`;
        const cachePath: string = StellePaths.GetCommandsPath();

        client.logger.info(`[API] Logged in | user: ${user.username}`);
        client.logger.info(`[Client] Ready | name: ${clientName} | shard: ${shardId}`);

        changePresence(client);

        await client.database.connect();
        await client.uploadCommands({ cachePath });

        client.manager.init({ id: user.id, username: clientName });
    },
});
