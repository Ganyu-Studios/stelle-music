import { Declare, type GuildCommandContext, LocalesT, type MessageStructure, SubCommand, type WebhookMessageStructure } from "seyfert";
import { stopQuiz } from "#stelle/utils/functions/manager/quiz.js";

@Declare({
    name: "stop",
    description: "Stop the running music quiz.",
})
@LocalesT("locales.quiz.commands.stop.name", "locales.quiz.commands.stop.description")
export default class QuizStopSubCommand extends SubCommand {
    public async run(ctx: GuildCommandContext): Promise<MessageStructure | WebhookMessageStructure | void> {
        const { guildId } = ctx;
        const { messages } = await ctx.locale();

        const stopped: boolean = await stopQuiz(guildId);
        if (!stopped) return ctx.errorReply(messages.commands.quiz.noQuiz, { ephemeral: true });

        return ctx.editOrReply({ content: messages.commands.quiz.stopped });
    }
}
