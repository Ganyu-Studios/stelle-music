import { EventNames } from "hoshimi";
import { inspect } from "#stelle/utils/functions/utils.js";
import { createLavalinkEvent } from "#stelle/utils/manager/events.js";

export default createLavalinkEvent({
    name: EventNames.NodeError,
    run(client, node, error): void {
        client.logger.info(`Lavalink - The node ${node.id} encountered an error: ${inspect(error)}`);
    },
});
