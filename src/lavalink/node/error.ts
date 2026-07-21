import { EventNames } from "hoshimi";
import { inspect } from "#stelle/utils/functions/internal/utils.js";
import { createLavalinkEvent } from "#stelle/utils/manager/events.js";

export default createLavalinkEvent({
    name: EventNames.NodeError,
    run(client, node, error): void {
        client.logger.error(`[Lavalink] Node error | node: ${node.id} | error: ${inspect(error)}`);
    },
});
