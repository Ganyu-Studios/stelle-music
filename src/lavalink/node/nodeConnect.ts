import { LavalinkEventTypes } from "#stelle/types";
import { createLavalinkEvent } from "#stelle/utils/manager/events.js";

export default createLavalinkEvent({
    name: "connect",
    type: LavalinkEventTypes.Node,
    run(client, node): void {
        client.logger.info(`Lavalink - The node ${node.id} is now connected.`);
    },
});
