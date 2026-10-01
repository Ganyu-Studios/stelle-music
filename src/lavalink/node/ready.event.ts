import { EventNames } from "hoshimi";
import { startupListener } from "#stelle/utils/listeners/node/startupListener.js";
import { createLavalinkEvent } from "#stelle/utils/manager/events.js";

/**
 * Node ids that have already fired `nodeReady` in this process. `nodeReady` fires on every (re)connect, but the
 * cold-start restore only makes sense on a node's first ready — later ones are node reconnects, where the players are
 * still in memory and resumeListener/libraryListener handle them.
 * @type {Set<string>}
 */
const readied: Set<string> = new Set();

export default createLavalinkEvent({
    name: EventNames.NodeReady,
    async run(client, node, retries, payload): Promise<void> {
        client.logger.info(`[Lavalink] Node connected | node: ${node.id} | retries: ${retries}`);

        const firstReady: boolean = !readied.has(node.id);

        readied.add(node.id);

        // Cold-start restore: re-join and resume 24/7 players from their persisted sessions (survives a full restart,
        // unlike the in-process resume which only covers Lavalink's short session window). Only on this node's first
        // ready, and not when Lavalink resumed the session — that's resumeListener's job (nodeResumed, which fires
        // concurrently with this handler), so gating keeps the two from doubling up on the same player.
        if (firstReady && !payload.resumed) await startupListener(client, node);
    },
});
