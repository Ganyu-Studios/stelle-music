import { DEBUG_MODE } from "#stelle/data/Constants.js";
import { Lavalink } from "#stelle/classes";

export default new Lavalink({
    name: "raw",
    type: "node",
    run: (client, node, payload) => DEBUG_MODE && client.debugger?.info(`[Node ${node.id}] Payload: `, payload)
});
