import { Lavalink } from "#stelle/classes";

export default new Lavalink({
    name: "connect",
    type: "node",
    run: (client, node) => client.logger.info(`Music - The node: ${node.id} is now connected.`),
});
