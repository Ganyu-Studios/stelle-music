import { Lavalink } from "#stelle/classes";

export default new Lavalink({
    name: "connect",
    type: "node",
    run: async (client, node) => {
        const players = [...client.manager.players.values()].filter((player) => player.node.id === node.id);
        if (client.config.sessions.resumePlayers && players.length && !node.resuming.enabled) {
            // make this shit works.
        }

        if (client.config.sessions.enabled) await node.updateSession(true, client.config.sessions.resumeTime);

        return client.logger.info(`Music - The node: ${node.id} is now connected.`);
    },
});
