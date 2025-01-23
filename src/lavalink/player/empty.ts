import { Embed } from "seyfert";
import { Lavalink } from "#stelle/classes";
import { LavalinkEventTypes } from "#stelle/types";

export default new Lavalink({
    name: "queueEnd",
    type: LavalinkEventTypes.Manager,
    async run(client, player): Promise<void> {
        if (!(player.textChannelId && player.voiceChannelId)) return;

        const messageId = player.get<string | undefined>("messageId");
        if (messageId) await client.messages.edit(messageId, player.textChannelId, { components: [] }).catch(() => null);

        const lyricsId = player.get<string | undefined>("lyricsId");
        if (lyricsId) {
            await client.messages.delete(lyricsId, player.textChannelId).catch(() => null);

            if (player.get<boolean>("lyricsEnabled"))
                await player.node.request(`/sessions/${player.node.sessionId}/players/${player.guildId}/unsubscribe`).catch(() => null);

            player.set("lyricsId", undefined);
            player.set("lyrics", undefined);
            player.set("lyricsEnabled", false);
        }

        const locale = player.get<string | undefined>("localeString");
        if (!locale) return;

        const voice = await client.channels.fetch(player.voiceChannelId);
        if (!voice.is(["GuildStageVoice", "GuildVoice"])) return;

        const { messages } = client.t(locale).get();

        if (voice.is(["GuildVoice"])) await voice.setVoiceStatus(messages.events.voiceStatus.queueEnd).catch(() => null);

        const embed = new Embed().setDescription(messages.events.playerEnd).setColor(client.config.color.success).setTimestamp();

        await client.messages.write(player.textChannelId, { embeds: [embed] }).catch(() => null);
    },
});
