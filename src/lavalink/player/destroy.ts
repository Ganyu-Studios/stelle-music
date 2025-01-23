import { Lavalink } from "#stelle/classes";
import { DEBUG_MODE } from "#stelle/data/Constants.js";
import { LavalinkEventTypes } from "#stelle/types";

export default new Lavalink({
    name: "playerDestroy",
    type: LavalinkEventTypes.Manager,
    async run(client, player): Promise<void> {
        client.sessions.delete(player.guildId);

        const voice = await client.channels.fetch(player.voiceChannelId ?? player.options.voiceChannelId);
        if (voice.is(["GuildVoice"])) await voice.setVoiceStatus(null).catch(() => null);

        if (!player.textChannelId) return;

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

        if (DEBUG_MODE) client.logger.debug(`[Lavalink PlayerDestroy] Destroyed player for guild ${player.guildId}`);
    },
});
