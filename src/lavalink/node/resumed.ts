import { Lavalink } from "#stelle/classes";

export default new Lavalink({
    name: "resumed",
    type: "node",
    run: (client, node, _payload, players) => {
        client.logger.info(`Music - The node: ${node.id} is now resumed.`);
        console.info({ players });
    },
});
