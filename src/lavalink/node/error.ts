import { Lavalink } from "#stelle/classes";
import { LavalinkEventTypes } from "#stelle/types";
import { getInspect } from "#stelle/utils/functions/utils.js";

export default new Lavalink({
    name: "error",
    type: LavalinkEventTypes.Node,
    run(client, node, error): void {
        client.logger.error(`Music - The node: ${node.id} has an error. Error: ${getInspect(error)}`);
    },
});
