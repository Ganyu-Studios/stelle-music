import { EventNames } from "hoshimi";
import { resumeListener } from "#stelle/utils/listeners/node/resumeListener.js";
import { createLavalinkEvent } from "#stelle/utils/manager/events.js";

export default createLavalinkEvent({
    name: EventNames.NodeResumed,
    async run(client, node, players): Promise<void> {
        await resumeListener(client, node, players);
    },
});
