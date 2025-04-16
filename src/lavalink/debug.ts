import { LavalinkEventTypes } from "#stelle/types";
import { Constants } from "#stelle/utils/data/constants.js";
import { createLavalinkEvent } from "#stelle/utils/manager/events.js";

export default createLavalinkEvent({
    name: "debug",
    type: LavalinkEventTypes.Manager,
    run(client, key, data): void {
        if (Constants.Debug) client.debugger?.info(`Manager: ${key} | Debug: ${JSON.stringify(data)}`);
    },
});
