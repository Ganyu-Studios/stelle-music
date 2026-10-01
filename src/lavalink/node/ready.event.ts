import { EventNames } from "hoshimi";
import { startupListener } from "#stelle/utils/listeners/node/startupListener.js";
import { createLavalinkEvent } from "#stelle/utils/manager/events.js";

export default createLavalinkEvent({
    name: EventNames.NodeReady,
    async run(client, node, retries, payload): Promise<void> {
        client.logger.info(`[Lavalink] Node connected | node: ${node.id} | retries: ${retries}`);

        // Cold-start restore: re-join and resume 24/7 players from their persisted sessions (survives a full restart,
        // unlike the in-process resume which only covers Lavalink's short session window). A resumed session is instead
        // handled by resumeListener (nodeResumed) — which is emitted without being awaited, so it runs concurrently with
        // this handler; gating on !payload.resumed keeps the two from doubling up on the same player.
        if (!payload.resumed) await startupListener(client, node);
    },
});
