import { EventNames } from "hoshimi";
import { startupListener } from "#stelle/utils/listeners/node/startupListener.js";
import { createLavalinkEvent } from "#stelle/utils/manager/events.js";

export default createLavalinkEvent({
    name: EventNames.NodeReady,
    async run(client, node): Promise<void> {
        client.logger.info(`[Lavalink] Node connected | node: ${node.id}`);

        // Cold-start restore: re-join and resume 24/7 players from their persisted sessions (survives a full restart,
        // unlike the in-process resume which only covers Lavalink's short session window).
        await startupListener(client, node);
    },
});
