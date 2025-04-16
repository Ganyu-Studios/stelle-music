import { LavalinkEventTypes } from "#stelle/types";
import { resumeListener } from "#stelle/utils/listeners/resumeListener.js";
import { createLavalinkEvent } from "#stelle/utils/manager/events.js";

export default createLavalinkEvent({
    name: "resumed",
    type: LavalinkEventTypes.Node,
    async run(client, node, _, players): Promise<void> {
        await resumeListener(client, node, players);
    },
});
