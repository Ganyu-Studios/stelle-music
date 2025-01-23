import { Lavalink } from "#stelle/classes";
import { DEBUG_MODE } from "#stelle/data/Constants.js";
import { LavalinkEventTypes } from "#stelle/types";

export default new Lavalink({
    name: "debug",
    type: LavalinkEventTypes.Manager,
    run(client, key, data): void {
        if (DEBUG_MODE) client.debugger?.info(`[Lavalink ${key}]:`, data);
    },
});
