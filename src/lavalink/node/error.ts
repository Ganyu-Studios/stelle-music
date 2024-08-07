import { Lavalink } from "#stelle/classes";
import { getDepth } from "#stelle/utils/functions/utils.js";

export default new Lavalink({
    name: "error",
    type: "node",
    run: (client, node, error) => client.logger.error(`Music - The node: ${node.id} has an error. Error: ${getDepth(error)}`),
});
