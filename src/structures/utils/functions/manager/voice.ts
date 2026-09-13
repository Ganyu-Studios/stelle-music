import type { PlayerStructure } from "hoshimi";
import type { AllGuildVoiceChannels, GuildMember, VoiceState } from "seyfert";

/**
 *
 * Joins the voice channel and handles stage channels.
 * @param {PlayerStructure} player The player instance.
 * @param {AllGuildVoiceChannels} voice The voice channel to join.
 * @param {GuildMember} me The bot's guild member instance.
 * @returns {Promise<void>} Resolves when the bot has joined the voice channel and handled stage channel suppression.
 */
export async function joinVoiceChannel(player: PlayerStructure, voice: AllGuildVoiceChannels, me: GuildMember): Promise<void> {
    if (!player.connected) await player.connect();

    let bot: VoiceState | null = await me.voice().catch((): null => null);
    if (!bot) bot = await me.voice().catch((): null => null);

    if (voice.isStage() && bot?.suppress) await bot.setSuppress(false);
}
