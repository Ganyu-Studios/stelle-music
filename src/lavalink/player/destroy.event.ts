import { EventNames } from "hoshimi";
import type { AllChannels } from "seyfert";
import { PanelOps } from "#stelle/utils/functions/manager/panel.js";
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

        if (await player.data.get("isRequestChannel")) await PanelOps.reset(client, player.guildId);

        const messageId: string | undefined = await player.data.get("messageId");
        if (messageId) await client.messages.edit(messageId, textId, { components: [] }).catch((): null => null);

        await PlayerOps.lyrics(client, player, textId, { clearEnabled: true });

        client.debug(`[Lavalink] Player destroyed | guild: ${player.guildId} | voice: ${voiceId} | text: ${textId}`);
    },
});
