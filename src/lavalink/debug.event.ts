import { DebugLevels, EventNames } from "hoshimi";
import { LogLevels } from "seyfert";
import { createLavalinkEvent } from "#stelle/utils/manager/events.js";

export default createLavalinkEvent({
    name: EventNames.Debug,
    run(client, level, message): void {
        client.debug(LogLevels.Debug, `[Lavalink] Manager debug | level: ${DebugLevels[level]} | message: ${message}`);
    },
});
