import { EventNames } from "hoshimi";
import { Constants } from "#stelle/utils/data/constants.js";
import { createLavalinkEvent } from "#stelle/utils/manager/events.js";

export default createLavalinkEvent({
    name: EventNames.NodeRaw,
    run(client, node, payload): void {
        if (Constants.Debug) client.debugger?.info(`[Node ${node.id}] Raw: ${JSON.stringify(payload)}`);
    },
});
