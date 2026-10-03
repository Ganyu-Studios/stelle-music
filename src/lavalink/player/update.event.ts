import { EventNames } from "hoshimi";
import { LogLevels } from "seyfert";
import { createLavalinkEvent } from "#stelle/utils/manager/events.js";
import { Sessions } from "#stelle/utils/manager/sessions.js";

export default createLavalinkEvent({
    name: EventNames.PlayerUpdate,
    async run(client, newPlayer): Promise<void> {
        if (!client.config.sessions.enabled) return;

        await Sessions.save(newPlayer);

        client.debug(
            LogLevels.Debug,
            `[Lavalink] Session updated | guild: ${newPlayer.guildId} | node: ${newPlayer.node.id} | voice: ${newPlayer.voiceId} | text: ${newPlayer.textId}`,
        );
    },
});
