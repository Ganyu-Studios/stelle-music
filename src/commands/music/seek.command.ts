import {
    Command,
    createStringOption,
    Declare,
    type GuildCommandContext,
    LocalesT,
    type MessageStructure,
    Middlewares,
    type OKFunction,
    Options,
    type WebhookMessageStructure,
} from "seyfert";
import { ApplicationIntegrationType, InteractionContextType } from "seyfert/lib/types/index.js";
import { StelleCategory } from "#stelle/types";
import { StelleOptions } from "#stelle/utils/decorator.js";
import { ms, TimeFormat } from "#stelle/utils/functions/internal/time.js";

const options = {
    time: createStringOption({
        description: "Enter the time. (Ex: 2min)",
        required: true,
        locales: {
            name: "locales.seek.option.name",
            description: "locales.seek.option.description",
        },
        value: ({ value }, ok: OKFunction<number | string>) => {
            const time: string[] = value.split(/\s*,\s*|\s+/);
            const milis: number[] = time.map((x): number => ms(x));
            const result: number = milis.reduce((a, b): number => a + b, 0);

            if (Number.isNaN(result)) return ok(value);

            return ok(result);
        },
    }),
};

@Declare({
    name: "seek",
    description: "Seek the current track.",
    integrationTypes: [ApplicationIntegrationType.GuildInstall],
    contexts: [InteractionContextType.Guild],
    aliases: ["sk"],
})
@StelleOptions({ cooldown: 5, category: StelleCategory.Music })
@Options(options)
@LocalesT("locales.seek.name", "locales.seek.description")
@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer"])
export default class SeekCommand extends Command {
    public override async run(
        ctx: GuildCommandContext<typeof options, "checkPlayer">,
    ): Promise<MessageStructure | WebhookMessageStructure | void> {
        const { options } = ctx;
        const { time } = options;

        const { messages } = await ctx.locale();

        const { player } = ctx.metadata.checkPlayer;

        const position = player.position;
        const track = player.queue.current;

        if (typeof time === "string" || Number.isNaN(time) || !Number.isFinite(time))
            return ctx.errorReply(messages.commands.seek.invalidTime({ time }));

        if (!track?.info.isSeekable) return ctx.errorReply(messages.commands.seek.noSeekable);

        if (time > track.info.length) return ctx.errorReply(messages.commands.seek.exeedsTime({ time: TimeFormat.toHumanize(time) }));

        await player.seek(time);
        await ctx.successReply(
            messages.commands.seek.seeked({
                time: TimeFormat.toHumanize(time),
                type: messages.commands.seek.type[time < position ? "rewond" : "seeked"],
            }),
        );
    }
}
