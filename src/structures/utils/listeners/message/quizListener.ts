import type { MessageStructure, UsingClient } from "seyfert";
import { getQuiz, handleGuess } from "#stelle/utils/functions/manager/quiz.js";

/**
 *
 * The listener for the `messageCreate` event, handling music quiz guesses. When a non-bot message lands in the
 * channel of a running quiz, it is treated as a guess and scored against the current track's title and artist.
 * Returns `true` when the message belonged to a quiz (so the caller skips the mention listener).
 * @param {UsingClient} client The client instance.
 * @param {MessageStructure} message The message instance.
 * @returns {Promise<boolean>} Whether the message was handled as a quiz guess.
 */
export async function quizListener(client: UsingClient, message: MessageStructure): Promise<boolean> {
    const { guildId, author, channelId, content } = message;
    if (!guildId || author.bot) return false;

    const session = getQuiz(guildId);
    if (!session || channelId !== session.channelId) return false;

    await handleGuess(client, session, author.id, content);

    return true;
}
