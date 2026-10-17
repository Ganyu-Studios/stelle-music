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
     * Resolve a voice channel by id, returning null when the id is missing, the channel no longer exists (deleted, or
     * the bot was removed from the guild) or it isn't a voice channel. The fetch is error-tolerant.
     * @param {UsingClient} client The client instance.
     * @param {string | undefined} voiceId The voice channel id (e.g. `player.voiceId`).
     * @returns {Promise<AllGuildVoiceChannels | null>} The voice channel, or null when unavailable.
     */
    async voice(client: UsingClient, voiceId: string | undefined): Promise<AllGuildVoiceChannels | null> {
        if (!voiceId) return null;

        const voice: AllChannels | null = await client.channels.fetch(voiceId).catch((): null => null);
        if (!voice?.is(["GuildStageVoice", "GuildVoice"])) return null;

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
        await player.data.delete("lyrics");

        const lyricsId: string | undefined = await player.data.get("lyricsId");
        if (!lyricsId) return;

        if (options.unsubscribe && (await player.data.get("lyricsEnabled"))) await player.lyrics.unsubscribe();

        await client.messages.delete(lyricsId, textId).catch((): null => null);
        await player.data.delete("lyricsId");

        if (options.clearEnabled) await player.data.delete("lyricsEnabled");
    },
};
