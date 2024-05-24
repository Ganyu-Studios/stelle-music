import { Lavalink } from "#stelle/classes";

export default new Lavalink({
    name: "disconnect",
    type: "shoukaku",
    run: (client, name) => client.logger.error(`Music - The node: ${name} is disconnected.`),
});
