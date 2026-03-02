import { EventNames } from "hoshimi";
import { createLavalinkEvent } from "#stelle/utils/manager/events.js";

export default createLavalinkEvent({
    name: EventNames.NodeDisconnect,
    run(client, node): void {
        client.logger.error(`Lavalink - The node: ${node.id} is disconnected.`);
    },
});
