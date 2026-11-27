import { EventNames } from "hoshimi";
import { createLavalinkEvent } from "#stelle/utils/manager/events.js";

export default createLavalinkEvent({
    name: EventNames.NodeDisconnect,
    run(client, node): void {
        client.logger.error(`[Lavalink] Node disconnected | node: ${node.id}`);
    },
});
