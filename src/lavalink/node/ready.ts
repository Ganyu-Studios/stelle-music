import { Lavalink } from "#stelle/classes";
import { LavalinkEventTypes } from "#stelle/types";

export default new Lavalink({
    name: "connect",
    type: LavalinkEventTypes.Node,
    async run(client, node): Promise<void> {
        const players = [...client.manager.players.values()].filter((player) => player.node.id === node.id);
        if (client.config.sessions.resumePlayers && players.length && !node.resuming.enabled) {
            for (const player of players) {
                try {
                    await player.queue.utils.sync(true, true);
                    await player.play({
                        track: player.queue.current ?? undefined,
                        paused: player.paused,
                        volume: player.volume,
                        position: player.position,
                        voice: player.voice,
                    });
                } catch (error) {
                    client.logger.error(`Music - Error resuming the player: ${player.guildId}`, error);
                }
            }
        }

        if (client.config.sessions.enabled) await node.updateSession(true, client.config.sessions.resumeTime);

        return client.logger.info(`Music - The node: ${node.id} is now connected.`);
    },
});
