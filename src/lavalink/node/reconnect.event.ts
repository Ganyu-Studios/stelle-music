import { EventNames } from "hoshimi";
import { ms } from "#stelle/utils/functions/internal/time.js";
import { createLavalinkEvent } from "#stelle/utils/manager/events.js";

export default createLavalinkEvent({
    name: EventNames.NodeReconnecting,
    run(client, node, retriesLeft, delay): void {
        client.logger.warn(`[Lavalink] Node reconnecting | node: ${node.id} | retriesLeft: ${retriesLeft} | delay: ${ms(delay)}`);
    },
});
