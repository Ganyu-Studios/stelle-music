import { EventNames } from "hoshimi";
import type { AllChannels } from "seyfert";
import { StelleMeta } from "#stelle/utils/data/constants.js";
import { PlayerOps } from "#stelle/utils/functions/manager/player.js";
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

        await PlayerOps.lyrics(client, player, textId, { clearEnabled: true });

        if (StelleMeta.Debug)
            client.debugger?.info(`[Lavalink] Player destroyed | guild: ${player.guildId} | voice: ${voiceId} | text: ${textId}`);
    },
});
