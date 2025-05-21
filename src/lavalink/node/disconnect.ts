import { LavalinkEventTypes } from "#stelle/types";
import { createLavalinkEvent } from "#stelle/utils/manager/events.js";

export default createLavalinkEvent({
    name: "disconnect",
    type: LavalinkEventTypes.Node,
    run(client, node): void {
        client.logger.error(`Lavalink - The node: ${node.id} is disconnected.`);
    },
});
