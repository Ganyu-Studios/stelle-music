import type { PlayerStructure } from "hoshimi";
import type { AllChannels, DefaultLocale, UsingClient } from "seyfert";
import type { ChannelType } from "seyfert/lib/types/index.js";

/**
 * The voice channel types that the player can connect to.
 */
type PlayerVoiceChannel = Extract<AllChannels, { type: ChannelType.GuildVoice | ChannelType.GuildStageVoice }>;

export const PlayerOps = {
    async messages(client: UsingClient, player: PlayerStructure): Promise<DefaultLocale["messages"] | null> {
        const locale: string | undefined = await player.data.get("localeString");
        if (!locale) return null;

        return client.t(locale).get().messages;
    },

    async voice(client: UsingClient, player: PlayerStructure): Promise<PlayerVoiceChannel | null> {
        if (!player.voiceId) return null;

        const voice: AllChannels = await client.channels.fetch(player.voiceId);
        if (!voice.is(["GuildStageVoice", "GuildVoice"])) return null;

        return voice;
    },

    async nowPlaying(client: UsingClient, player: PlayerStructure, textId: string): Promise<void> {
        const messageId: string | undefined = await player.data.get("messageId");
        if (!messageId) return;

        if (client.config.deleter.onTrackEnd) await client.messages.delete(messageId, textId).catch((): null => null);
        else await client.messages.edit(messageId, textId, { components: [] }).catch((): null => null);
    },

    async lyrics(
        client: UsingClient,
        player: PlayerStructure,
        textId: string,
        options: { unsubscribe?: boolean; clearEnabled?: boolean } = {},
    ): Promise<void> {
        const lyricsId: string | undefined = await player.data.get("lyricsId");
        if (!lyricsId) return;

        await client.messages.delete(lyricsId, textId).catch((): null => null);

        if (options.unsubscribe && (await player.data.get("lyricsEnabled"))) await player.lyrics.unsubscribe();

        await player.data.delete("lyricsId");
        await player.data.delete("lyrics");
        if (options.clearEnabled) await player.data.delete("lyricsEnabled");
    },
};
