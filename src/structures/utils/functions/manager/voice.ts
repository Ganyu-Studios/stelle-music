import type { PlayerStructure } from "hoshimi";
import type { AllGuildVoiceChannels, GuildMember, UsingClient, VoiceState } from "seyfert";

/**
 *
 * Joins the voice channel and handles stage channels.
 * @param {PlayerStructure} player The player instance.
 * @param {AllGuildVoiceChannels} voice The voice channel to join.
 * @param {GuildMember} me The bot's guild member instance.
 * @returns {Promise<void>} Resolves when the bot has joined the voice channel and applied (or deferred) the stage-channel unsuppress.
 */
export async function joinVoiceChannel(player: PlayerStructure, voice: AllGuildVoiceChannels, me: GuildMember): Promise<void> {
    const connected: boolean = player.connected;
    if (!player.connected) await player.connect();

    // Stage channels: Discord denies the audio of a suppressed member (the "audience"), so the bot must be
    // unsuppressed before anything is heard — but only once its voice connection is up (see `deferUnsuppress`). A
    // freshly sent join is deferred by the resulting voice-state event (see `playerListener`). This covers the bot
    // already settled in the target channel (e.g. it was dragged there by hand, or a previous unsuppress failed):
    // with its connection already up it is raised right away, otherwise the raise waits for the connection too.
    if (!voice.isStage()) return;

    const bot: VoiceState | null = await me.voice("rest").catch((): null => null);
    if (bot?.channelId !== voice.id || !bot.suppress) return;

    if (connected) await bot.setSuppress(false).catch((): null => null);
    else await deferUnsuppress(player);
}

/**
 *
 * Defer raising the bot to speaker in a stage channel until its voice connection is up (see `releaseUnsuppress`).
 * If the bot is already a speaker when Discord's voice server handshakes the connection, the server routes its audio
 * through a path stage listeners never receive (it hands out a random high SSRC instead of the sequential one): the
 * node streams normally, yet the stage stays silent for the whole connection. Raising it after the handshake keeps
 * the working route.
 * @param {PlayerStructure} player The player instance.
 * @returns {Promise<void>} Resolves when the unsuppress is marked as pending.
 */
export async function deferUnsuppress(player: PlayerStructure): Promise<void> {
    await player.data.set("pendingUnsuppress", true);
}

/**
 *
 * Raise the bot to speaker if a stage join deferred it and the node now reports the voice connection as up. Meant
 * for the player update event, where `player.connected` carries the node's view rather than the local one.
 * @param {UsingClient} client The client instance.
 * @param {PlayerStructure} player The player instance.
 * @returns {Promise<void>} Resolves when the pending unsuppress (if any) was applied.
 */
export async function releaseUnsuppress(client: UsingClient, player: PlayerStructure): Promise<void> {
    if (!player.connected || !(await player.data.get("pendingUnsuppress"))) return;

    await player.data.delete("pendingUnsuppress");
    await client.voiceStates.setSuppress(player.guildId, false).catch((): null => null);
}
