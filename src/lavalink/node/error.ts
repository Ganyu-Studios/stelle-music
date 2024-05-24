import { Lavalink } from "#stelle/classes";
import { getDepth } from "#stelle/utils/functions/utils.js";

export default new Lavalink({
    name: "error",
    type: "shoukaku",
    run: (client, name, error) => client.logger.error(`Music - The node: ${name} has an error. Error: ${getDepth(error)}`),
});
