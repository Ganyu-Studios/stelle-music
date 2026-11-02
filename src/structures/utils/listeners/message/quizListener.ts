import type { MessageStructure, UsingClient, VoiceState } from "seyfert";
import { QuizOps } from "#stelle/utils/functions/manager/quiz.js";

/**
 *
 * The listener for the `messageCreate` event, handling music quiz guesses. When a non-bot message lands in the
 * channel of a running quiz — from a member listening in the quiz voice channel — it is scored against the current
 * track's title and artist. Returns `true` when the message was consumed as a guess (so the caller skips the
 * mention listener).
 * @param {UsingClient} client The client instance.
 * @param {MessageStructure} message The message instance.
 * @returns {Promise<boolean>} Whether the message was handled as a quiz guess.
 */
export async function quizListener(client: UsingClient, message: MessageStructure): Promise<boolean> {
    const { guildId, author, channelId, content, member } = message;
    if (!guildId || author.bot || !member) return false;

    const session = QuizOps.get(guildId);
    if (!session || channelId !== session.channelId) return false;

    // You must be listening in the quiz voice channel to guess — otherwise you can't hear the snippet.
    const voice: VoiceState | null = await member.voice().catch((): null => null);
    if (voice?.channelId !== session.player.voiceId) return false;

    await QuizOps.guess(client, session, author.id, content);

    return true;
}
