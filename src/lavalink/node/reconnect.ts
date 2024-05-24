import { Lavalink } from "#stelle/classes";

export default new Lavalink({
    name: "reconnecting",
    type: "shoukaku",
    run: (client, name, retries) => client.logger.warn(`Music - The node: ${name} is reconnecting... Retries left: ${retries}`),
});
