import { EventNames } from "hoshimi";
import type { AllChannels } from "seyfert";
import { Constants } from "#stelle/utils/data/constants.js";
import { createLavalinkEvent } from "#stelle/utils/manager/events.js";
import { Sessions } from "#stelle/utils/manager/sessions.js";

export default createLavalinkEvent({
    name: EventNames.PlayerDestroy,
    async run(client, player): Promise<void> {
        Sessions.delete(player.guildId);

        const textId: string | undefined = player.textId ?? player.options.textId;
        if (!textId) return;

        const voiceId: string | undefined = player.voiceId ?? player.options.voiceId;
        if (!voiceId) return;

        const voice: AllChannels = await client.channels.fetch(voiceId);
        if (voice.isVoice()) await voice.setVoiceStatus(null).catch((): null => null);

        const messageId: string | undefined = await player.data.get("messageId");
        if (messageId) await client.messages.edit(messageId, textId, { components: [] }).catch((): null => null);

        const lyricsId: string | undefined = await player.data.get("lyricsId");
        if (lyricsId) {
            await client.messages.delete(lyricsId, textId).catch((): null => null);

            await player.data.delete("lyricsId");
            await player.data.delete("lyrics");
            await player.data.delete("lyricsEnabled");
        }

        if (Constants.Debug)
            client.debugger?.info(`[Lavalink] Player destroyed | guild: ${player.guildId} | voice: ${voiceId} | text: ${textId}`);
    },
});
