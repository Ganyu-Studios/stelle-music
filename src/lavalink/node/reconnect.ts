import { Lavalink } from "#stelle/classes";
import { LavalinkEventTypes } from "#stelle/types";

export default new Lavalink({
    name: "reconnecting",
    type: LavalinkEventTypes.Node,
    run(client, node) {
        client.logger.warn(`Music - The node: ${node.id} is reconnecting...`);
    },
});
