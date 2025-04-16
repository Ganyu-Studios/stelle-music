import { LavalinkEventTypes } from "#stelle/types";
import { createLavalinkEvent } from "#stelle/utils/manager/events.js";

import { Embed } from "seyfert";

export default createLavalinkEvent({
    name: "queueEnd",
    type: LavalinkEventTypes.Manager,
    async run(client, player): Promise<void> {
        if (!(player.textChannelId && player.voiceChannelId)) return;

        const messageId = player.get<string | undefined>("messageId");
        if (messageId) await client.messages.edit(messageId, player.textChannelId, { components: [] }).catch(() => null);

        const lyricsId = player.get<string | undefined>("lyricsId");
        if (lyricsId) {
            await client.messages.delete(lyricsId, player.textChannelId).catch(() => null);

            if (player.get<boolean | undefined>("lyricsEnabled")) await player.node.lyrics.unsubscribe(player.guildId).catch(() => null);

            player.set("lyricsId", undefined);
            player.set("lyrics", undefined);
            player.set("lyricsEnabled", undefined);
        }

        const locale = player.get<string | undefined>("localeString");
        if (!locale) return;

        const voice = await client.channels.fetch(player.voiceChannelId);
        if (!voice.is(["GuildStageVoice", "GuildVoice"])) return;

        const { messages } = client.t(locale).get();

        if (voice.isVoice()) await voice.setVoiceStatus(messages.events.voiceStatus.queueEnd).catch(() => null);

        const embed = new Embed().setDescription(messages.events.playerEnd).setColor(client.config.color.success).setTimestamp();

        await client.messages.write(player.textChannelId, { embeds: [embed] }).catch(() => null);

        player.set("messageId", undefined);
    },
});
