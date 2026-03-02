import { EventNames } from "hoshimi";
import { ms } from "#stelle/utils/functions/time.js";
import { createLavalinkEvent } from "#stelle/utils/manager/events.js";

export default createLavalinkEvent({
    name: EventNames.NodeReconnecting,
    run(client, node, retriesLeft, delay): void {
        client.logger.warn(`Lavalink - The node: ${node.id} is reconnecting ... (Retries left: ${retriesLeft}, Delay: ${ms(delay)})`);
    },
});
