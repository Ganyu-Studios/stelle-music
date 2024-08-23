import { Lavalink } from "#stelle/classes";
import { sessions } from "#stelle/utils/functions/utils.js";

export default new Lavalink({
    name: "connect",
    type: "node",
    run: async (client, node) => {
        client.logger.info(`Music - The node: ${node.id} is now connected.`);

        sessions.set("sessionId", node.sessionId!);
        await node.updateSession(true, 60000);
    },
});
