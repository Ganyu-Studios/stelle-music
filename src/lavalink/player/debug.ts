import { Lavalink } from "#stelle/classes";
import { DEBUG_MODE } from "#stelle/data/Constants.js";

export default new Lavalink({
    name: "debug",
    type: "manager",
    run: (client, key, data) => DEBUG_MODE && client.debugger?.info(`[Lavalink ${key}] Data:`, data),
});
