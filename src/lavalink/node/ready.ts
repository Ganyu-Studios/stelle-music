import { EventNames } from "hoshimi";
import { connectListener } from "#stelle/utils/listeners/node/connectListener.js";
import { createLavalinkEvent } from "#stelle/utils/manager/events.js";

export default createLavalinkEvent({
    name: EventNames.NodeReady,
    async run(client, node): Promise<void> {
        await connectListener(client, node);

        const resuming: boolean = client.config.sessions.enabled;
        const timeout: number = client.config.sessions.resumeTime;

        if (resuming) {
            client.logger.info(`[Lavalink] Node session updated | node: ${node.id} | resuming: ${resuming} | timeout: ${timeout}ms`);

            await node.updateSession({ resuming, timeout });
        }

        client.logger.info(`[Lavalink] Node connected | node: ${node.id}`);
    },
});
