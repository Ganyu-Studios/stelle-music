import {
    type AllGuildVoiceChannels,
    Declare,
    type GuildCommandContext,
    type GuildMember,
    LocalesT,
    type MessageStructure,
    Middlewares,
    SubCommand,
    type VoiceState,
    type WebhookMessageStructure,
} from "seyfert";
import { MessageFlags } from "seyfert/lib/types/index.js";
import { QuizOps } from "#stelle/utils/functions/manager/quiz.js";

@Declare({
    name: "start",
    description: "Start a music quiz.",
})
@LocalesT("locales.quiz.commands.start.name", "locales.quiz.commands.start.description")
@Middlewares(["checkNodes", "checkVoiceChannel"])
export default class QuizStartSubCommand extends SubCommand {
    public async run(ctx: GuildCommandContext): Promise<MessageStructure | WebhookMessageStructure | void> {
        const { client, guildId, channelId, member } = ctx;
        const { messages } = await ctx.locale();

        if (!member) return;

        const me: GuildMember | null = await ctx.me().catch((): null => null);
        if (!me) return;

        const state: VoiceState | null = await member.voice().catch((): null => null);
        const voice: AllGuildVoiceChannels | null | undefined = await state?.channel().catch((): null => null);
        if (!voice) return ctx.errorReply(messages.commands.quiz.notInVoice, { ephemeral: true });

        await ctx.deferReply();

        const result = await QuizOps.start({ client, guildId, channelId, voice, me, localeString: await ctx.localeString() });
        if (!result.ok) {
            const reasons: Record<typeof result.reason, string> = {
                alreadyRunning: messages.commands.quiz.alreadyRunning,
                busy: messages.commands.quiz.busy,
                notEnoughTracks: messages.commands.quiz.notEnoughTracks,
            };

            return ctx.editOrReply({ content: reasons[result.reason], flags: MessageFlags.Ephemeral });
        }

        return ctx.editOrReply({ content: messages.commands.quiz.started({ rounds: result.rounds }) });
    }
}
