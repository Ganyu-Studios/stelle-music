import { EventNames } from "hoshimi";
import { UtilsOps } from "#stelle/utils/functions/internal/utils.js";
import { createLavalinkEvent } from "#stelle/utils/manager/events.js";

export default createLavalinkEvent({
    name: EventNames.NodeError,
    run(client, node, error): void {
        client.logger.error(`[Lavalink] Node error | node: ${node.id} | error: ${UtilsOps.inspect(error)}`);
    },
});
