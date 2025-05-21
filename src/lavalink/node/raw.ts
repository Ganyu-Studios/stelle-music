import { LavalinkEventTypes } from "#stelle/types";
import { Constants } from "#stelle/utils/data/constants.js";
import { createLavalinkEvent } from "#stelle/utils/manager/events.js";

export default createLavalinkEvent({
    name: "raw",
    type: LavalinkEventTypes.Node,
    run(client, node, payload): void {
        if (Constants.Debug) client.debugger?.info(`Node: ${node.id} | Raw Payload: ${JSON.stringify(payload)}`);
    },
});
