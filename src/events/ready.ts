import { createEvent } from "seyfert";

export default createEvent({
    data: { name: "ready", once: true },
    run(user, client, shardId) {
        client.readyTimestamp = Date.now();

        const clientName = `${user.username} v0.0.0`;

        client.logger.info(`API - Logged in as: ${user.username}`);
        client.logger.info(`Client - ${clientName} is now ready on shard #${shardId}.`);
    },
});
