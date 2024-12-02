import { Lavalink } from "#stelle/classes";

export default new Lavalink({
    name: "connect",
    type: "node",
    run: async (client, node) => {
        await node.updateSession(true, client.config.resumeTime);
        return client.logger.info(`Music - The node: ${node.id} is now connected.`);
    },
});
