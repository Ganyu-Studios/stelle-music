import { Lavalink } from "#stelle/classes";

export default new Lavalink({
    name: "ready",
    type: "shoukaku",
    run: (client, name) => client.logger.info(`Music - The node: ${name} is now connected.`),
});
