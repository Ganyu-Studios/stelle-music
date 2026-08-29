import { EventNames } from "hoshimi";
import { createLavalinkEvent } from "#stelle/utils/manager/events.js";

export default createLavalinkEvent({
    name: EventNames.NodeReady,
    run(client, node): void {
        client.logger.info(`[Lavalink] Node connected | node: ${node.id}`);
    },
});
