import type { PlayerStructure } from "hoshimi";
import type { AllChannels, AllGuildVoiceChannels, DefaultLocale, UsingClient } from "seyfert";

/**
 * The interface for the options when unsubscribing a player from lyrics updates.
 */
interface UnsubscribeOptions {
    /**
     * Whether to unsubscribe the player from lyrics updates.
     * @type {boolean}
     * @default false
     */
    unsubscribe?: boolean;
    /**
     * Whether to clear the lyrics enabled state for the player.
     * @type {boolean}
     * @default false
     */
    clearEnabled?: boolean;
}

export const PlayerOps = {
    /**
     *
     * Return the messages for the player based on the locale.
     * @param {UsingClient} client The client instance.
     * @param {PlayerStructure} player The player structure.
     * @returns {Promise<DefaultLocale["messages"] | null>} The messages for the player or null if not found.
     */
    async messages(client: UsingClient, player: PlayerStructure): Promise<DefaultLocale["messages"] | null> {
        const locale: string | undefined = await player.data.get("localeString");
        if (!locale) return null;

        return client.t(locale).get().messages;
    },
    /**
     *
     * Return the voice channel for the player.
     * @param {UsingClient} client The client instance.
     * @param {PlayerStructure} player The player structure.
     * @returns {Promise<AllGuildVoiceChannels | null>} The voice channel for the player or null if not found.
     */
    async voice(client: UsingClient, player: PlayerStructure): Promise<AllGuildVoiceChannels | null> {
        if (!player.voiceId) return null;

        const voice: AllChannels = await client.channels.fetch(player.voiceId);
        if (!voice.is(["GuildStageVoice", "GuildVoice"])) return null;

        return voice;
    },
    /**
     *
     * Return the text channel for the player.
     * @param {UsingClient} client The client instance.
     * @param {PlayerStructure} player The player structure.
     * @param {string} textId The text channel ID.
     * @returns {Promise<AllChannels | null>} The text channel for the player or null if not found.
     */
    async nowPlaying(client: UsingClient, player: PlayerStructure, textId: string): Promise<void> {
        const messageId: string | undefined = await player.data.get("messageId");
        if (!messageId) return;

        if (client.config.deleter.onTrackEnd) await client.messages.delete(messageId, textId).catch((): null => null);
        else await client.messages.edit(messageId, textId, { components: [] }).catch((): null => null);
    },
    /**
     *
     * Remove the lyrics message for the player.
     * @param {UsingClient} client The client instance.
     * @param {PlayerStructure} player The player structure.
     * @param {string} textId The text channel ID.
     * @param {UnsubscribeOptions} options The options for the operation.
     * @returns {Promise<void>} A promise that resolves when the operation is complete.
     */
    async lyrics(client: UsingClient, player: PlayerStructure, textId: string, options: UnsubscribeOptions = {}): Promise<void> {
        const lyricsId: string | undefined = await player.data.get("lyricsId");
        if (!lyricsId) return;

        await client.messages.delete(lyricsId, textId).catch((): null => null);

        if (options.unsubscribe && (await player.data.get("lyricsEnabled"))) await player.lyrics.unsubscribe();

        await player.data.delete("lyricsId");
        await player.data.delete("lyrics");
        if (options.clearEnabled) await player.data.delete("lyricsEnabled");
    },
};
