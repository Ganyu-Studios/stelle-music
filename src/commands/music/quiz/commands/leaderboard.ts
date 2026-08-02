import { Declare, type GuildCommandContext, LocalesT, type MessageStructure, SubCommand, type WebhookMessageStructure } from "seyfert";
import { getQuiz, leaderboardText } from "#stelle/utils/functions/manager/quiz.js";

@Declare({
    name: "leaderboard",
    description: "Show the current music quiz standings.",
})
@LocalesT("locales.quiz.commands.leaderboard.name", "locales.quiz.commands.leaderboard.description")
export default class QuizLeaderboardSubCommand extends SubCommand {
    public async run(ctx: GuildCommandContext): Promise<MessageStructure | WebhookMessageStructure | void> {
        const { guildId } = ctx;
        const { messages } = await ctx.locale();

        const session = getQuiz(guildId);
        if (!session) return ctx.errorReply(messages.commands.quiz.noQuiz, { ephemeral: true });

        return ctx.editOrReply({ content: leaderboardText(messages, session.scores) });
    }
}
