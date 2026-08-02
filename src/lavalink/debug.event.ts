import { DebugLevels, EventNames } from "hoshimi";
import { createLavalinkEvent } from "#stelle/utils/manager/events.js";

export default createLavalinkEvent({
    name: EventNames.Debug,
    run(client, level, message): void {
        client.debug(`[Lavalink] Manager debug | level: ${DebugLevels[level]} | message: ${message}`);
    },
});
