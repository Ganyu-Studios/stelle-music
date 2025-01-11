import { DEBUG_MODE } from "#stelle/data/Constants.js";
import { Lavalink } from "#stelle/classes";

export default new Lavalink({
    name: "debug",
    type: "manager",
    run: (client, key, data) => DEBUG_MODE && client.debugger?.info(`[Lavalink ${key}] Data:`, data)
});
