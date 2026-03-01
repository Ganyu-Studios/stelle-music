import { LavalinkEventTypes } from "#stelle/types";
import { Constants } from "#stelle/utils/data/constants.js";
import { createLavalinkEvent } from "#stelle/utils/manager/events.js";
import { Sessions } from "#stelle/utils/manager/sessions.js";

export default createLavalinkEvent({
    name: "playerDestroy",
    type: LavalinkEventTypes.Manager,
    async run(client, player): Promise<void> {
        Sessions.delete(player.guildId);

        const voice = await client.channels.fetch(player.voiceChannelId ?? player.options.voiceChannelId);
        if (voice.isVoice()) await voice.setVoiceStatus(null).catch((): null => null);

        if (!player.textChannelId) return;

        const messageId = player.get<string | undefined>("messageId");
        if (messageId) await client.messages.edit(messageId, player.textChannelId, { components: [] }).catch((): null => null);

        const lyricsId = player.get<string | undefined>("lyricsId");
        if (lyricsId) {
            await client.messages.delete(lyricsId, player.textChannelId).catch((): null => null);

            player.set("lyricsId", undefined);
            player.set("lyrics", undefined);
            player.set("lyricsEnabled", undefined);
        }

        if (Constants.Debug) client.debugger?.info(`[Player ${player.guildId}] Destroyed Player: ${JSON.stringify(player.toJSON())}`);
    },
});
