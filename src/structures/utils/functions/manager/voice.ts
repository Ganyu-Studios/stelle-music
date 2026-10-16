import type { PlayerStructure } from "hoshimi";
import type { AllGuildVoiceChannels, GuildMember, VoiceState } from "seyfert";

/**
 *
 * Joins the voice channel and handles stage channels.
 * @param {PlayerStructure} player The player instance.
 * @param {AllGuildVoiceChannels} voice The voice channel to join.
 * @param {GuildMember} me The bot's guild member instance.
 * @returns {Promise<void>} Resolves when the bot has joined the voice channel and applied the stage-channel unsuppress when possible.
 */
export async function joinVoiceChannel(player: PlayerStructure, voice: AllGuildVoiceChannels, me: GuildMember): Promise<void> {
    if (!player.connected) await player.connect();

    // Stage channels: Discord denies the audio of a suppressed member (the "audience"), so the bot must be
    // unsuppressed before anything is heard. A freshly sent join can't be fixed from here — `connect()` only
    // queues the voice-state op, and Discord rejects the change until the user is registered as joined. The
    // resulting voice-state event unsuppresses instead (see `playerListener`). This covers the remaining case:
    // the bot is already settled in the target channel (e.g. it was dragged there by hand, or a previous
    // unsuppress failed), where the read below is race-free and the change is accepted.
    if (!voice.isStage()) return;

    const bot: VoiceState | null = await me.voice("rest").catch((): null => null);
    if (bot?.channelId !== voice.id || !bot.suppress) return;

    await bot.setSuppress(false).catch((): null => null);
}
