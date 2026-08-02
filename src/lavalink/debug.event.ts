import { DebugLevels, EventNames } from "hoshimi";
import { StelleMeta } from "#stelle/utils/data/constants.js";
import { createLavalinkEvent } from "#stelle/utils/manager/events.js";

export default createLavalinkEvent({
    name: EventNames.Debug,
    run(client, level, message): void {
        if (StelleMeta.Debug) client.debugger?.info(`[Lavalink] Manager debug | level: ${DebugLevels[level]} | message: ${message}`);
    },
});
