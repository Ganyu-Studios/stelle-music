import { LavalinkEventTypes } from "#stelle/types";
import { createLavalinkEvent } from "#stelle/utils/manager/events.js";

export default createLavalinkEvent({
    name: "reconnecting",
    type: LavalinkEventTypes.Node,
    run(client, node): void {
        client.logger.warn(`Music - The node: ${node.id} is reconnecting...`);
    },
});
