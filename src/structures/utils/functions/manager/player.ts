import type { PlayerStructure } from "hoshimi";
import type { AllChannels, DefaultLocale, UsingClient } from "seyfert";
import type { ChannelType } from "seyfert/lib/types/index.js";

/**
 * The voice channels a player can live in (the stage/voice members of the channel union).
 */
type PlayerVoiceChannel = Extract<AllChannels, { type: ChannelType.GuildVoice | ChannelType.GuildStageVoice }>;

/**
 * Resolve the player's stored locale into its message tree. The now-playing / queue-end / voice-state code paths run
 * outside a command context and all read the locale off `player.data`, so this centralizes that lookup.
 * @param {UsingClient} client The client instance.
 * @param {PlayerStructure} player The player to read the locale from.
 * @returns {Promise<DefaultLocale["messages"] | null>} The messages, or null when the player has no stored locale.
 */
export async function getPlayerMessages(client: UsingClient, player: PlayerStructure): Promise<DefaultLocale["messages"] | null> {
    const locale: string | undefined = await player.data.get("localeString");
    if (!locale) return null;

    return client.t(locale).get().messages;
}

/**
 * Fetch the player's voice channel and narrow it to a stage/voice channel, returning null when it isn't one (or the
 * player has no voice id). Shared by the events that then read occupancy or set the voice status.
 * @param {UsingClient} client The client instance.
 * @param {PlayerStructure} player The player to fetch the voice channel of.
 * @returns {Promise<PlayerVoiceChannel | null>} The voice/stage channel, or null.
 */
export async function fetchPlayerVoice(client: UsingClient, player: PlayerStructure): Promise<PlayerVoiceChannel | null> {
    if (!player.voiceId) return null;

    const voice: AllChannels = await client.channels.fetch(player.voiceId);
    if (!voice.is(["GuildStageVoice", "GuildVoice"])) return null;

    return voice;
}

/**
 * Tear down the now-playing message: delete it when the `onTrackEnd` deleter is enabled, otherwise just strip its
 * components. No-op when there is no stored message. Callers still own clearing the `messageId` data key, since the
 * timing of that differs between the track-end and queue-end flows.
 * @param {UsingClient} client The client instance.
 * @param {PlayerStructure} player The player whose now-playing message is torn down.
 * @param {string} textId The text channel id the message lives in.
 * @returns {Promise<void>} A promise that resolves once the message is handled.
 */
export async function clearNowPlaying(client: UsingClient, player: PlayerStructure, textId: string): Promise<void> {
    const messageId: string | undefined = await player.data.get("messageId");
    if (!messageId) return;

    if (client.config.deleter.onTrackEnd) await client.messages.delete(messageId, textId).catch((): null => null);
    else await client.messages.edit(messageId, textId, { components: [] }).catch((): null => null);
}

/**
 * Tear down the lyrics message and its stored state. No-op when there is no lyrics message. The two flags keep each
 * caller's exact behaviour: `unsubscribe` stops the live lyrics feed (only when it was enabled), and `clearEnabled`
 * also drops the `lyricsEnabled` flag (the per-track end keeps it, the queue-end / destroy paths clear it).
 * @param {UsingClient} client The client instance.
 * @param {PlayerStructure} player The player whose lyrics are torn down.
 * @param {string} textId The text channel id the lyrics message lives in.
 * @param {{ unsubscribe?: boolean; clearEnabled?: boolean }} [options] The teardown flags.
 * @returns {Promise<void>} A promise that resolves once the lyrics are torn down.
 */
export async function clearPlayerLyrics(
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
}
