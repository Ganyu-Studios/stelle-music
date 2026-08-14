import { EventNames, type PlayerJSON } from "hoshimi";
import { LogLevels } from "seyfert";
import { createLavalinkEvent } from "#stelle/utils/manager/events.js";
import { Sessions } from "#stelle/utils/manager/sessions.js";

export default createLavalinkEvent({
    name: EventNames.PlayerUpdate,
    async run(client, newPlayer, oldPlayer): Promise<void> {
        if (!client.config.sessions.enabled) return;

        const newPlayerJson: PlayerJSON = newPlayer.toJSON();

        if (
            !oldPlayer ||
            oldPlayer.voiceId !== newPlayerJson.voiceId ||
            oldPlayer.textId !== newPlayerJson.textId ||
            oldPlayer.options.selfDeaf !== newPlayerJson.options.selfDeaf ||
            oldPlayer.options.selfMute !== newPlayerJson.options.selfDeaf ||
            oldPlayer.node.id !== newPlayerJson.node.id ||
            oldPlayer.node.sessionId !== newPlayerJson.node.sessionId
        ) {
            await Sessions.save(newPlayer);

            client.debug(
                LogLevels.Debug,
                `[Lavalink] Session updated | guild: ${newPlayer.guildId} | node: ${newPlayer.node.id} | voice: ${newPlayer.voiceId} | text: ${newPlayer.textId}`,
            );
        }
    },
});
