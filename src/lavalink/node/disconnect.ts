import { Lavalink } from "#stelle/classes";
import { LavalinkEventTypes } from "#stelle/types";

export default new Lavalink({
    name: "disconnect",
    type: LavalinkEventTypes.Node,
    run(client, node): void {
        client.logger.error(`Music - The node: ${node.id} is disconnected.`);
    },
});
