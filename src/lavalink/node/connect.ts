import { LavalinkEventTypes } from "#stelle/types";
import { connectListener } from "#stelle/utils/listeners/connectListener.js";
import { createLavalinkEvent } from "#stelle/utils/manager/events.js";

export default createLavalinkEvent({
    name: "connect",
    type: LavalinkEventTypes.Node,
    async run(client, node): Promise<void> {
        await connectListener(client, node);

        if (client.config.sessions.enabled) await node.updateSession(true, client.config.sessions.resumeTime);

        client.logger.info(`Lavalink - The node ${node.id} is now connected.`);
    },
});
