import { Lavalink, sessions } from "#stelle/classes";
import { DEBUG_MODE } from "#stelle/data/Constants.js";

export default new Lavalink({
    name: "playerDestroy",
    type: "manager",
    run: (client, player) => {
        sessions.delete(player.guildId);
        return DEBUG_MODE && client.logger.debug(`[Lavalink PlayerDestroy] Destroyed player for guild ${player.guildId}`);
    },
});
