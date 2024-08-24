import { Lavalink } from "#stelle/classes";
import { DEBUG_MODE } from "#stelle/data/Constants.js";

export default new Lavalink({
    name: "raw",
    type: "node",
    run: (client, node, payload) => {
        if (!DEBUG_MODE) return;
        return client.debugger?.info(node.id, payload);
    },
});
