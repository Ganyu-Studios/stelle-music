import { LavalinkEventTypes } from "#stelle/types";
import { getInspect } from "#stelle/utils/functions/utils.js";
import { createLavalinkEvent } from "#stelle/utils/manager/events.js";

export default createLavalinkEvent({
    name: "error",
    type: LavalinkEventTypes.Node,
    run(client, node, error): void {
        client.logger.info(`Lavalink - The node ${node.id} encountered an error: ${getInspect(error)}`);
    },
});
