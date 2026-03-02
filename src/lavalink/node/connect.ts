import { EventNames } from "hoshimi";
import { connectListener } from "#stelle/utils/listeners/node/connectListener.js";
import { createLavalinkEvent } from "#stelle/utils/manager/events.js";

export default createLavalinkEvent({
    name: EventNames.NodeReady,
    async run(client, node): Promise<void> {
        await connectListener(client, node);

        const resuming: boolean = client.config.sessions.enabled;
        const timeout: number = client.config.sessions.resumeTime;

        if (resuming) await node.updateSession({ resuming, timeout });

        client.logger.info(`Lavalink - The node ${node.id} is now connected.`);
    },
});
