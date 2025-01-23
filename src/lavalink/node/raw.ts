import { Lavalink } from "#stelle/classes";
import { DEBUG_MODE } from "#stelle/data/Constants.js";
import { LavalinkEventTypes } from "#stelle/types";

export default new Lavalink({
    name: "raw",
    type: LavalinkEventTypes.Node,
    run(client, node, payload): void {
        if (DEBUG_MODE) client.debugger?.info(`[Node ${node.id}] Payload: `, payload);
    },
});
