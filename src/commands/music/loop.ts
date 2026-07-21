import { LoopMode } from "hoshimi";
import { Command, createNumberOption, Declare, type GuildCommandContext, LocalesT, Middlewares, Options } from "seyfert";
import { ApplicationIntegrationType, InteractionContextType } from "seyfert/lib/types/index.js";
import { StelleCategory } from "#stelle/types";
import { StelleMusic } from "#stelle/utils/data/constants.js";
import { StelleOptions } from "#stelle/utils/decorator.js";

const loopModes: Record<LoopMode, LoopMode> = {
    [LoopMode.Off]: LoopMode.Track,
    [LoopMode.Track]: LoopMode.Queue,
    [LoopMode.Queue]: LoopMode.Off,
};

const options = {
    mode: createNumberOption({
        description: "Select the loop mode.",
        choices: [
            {
                name: "Off",
                value: LoopMode.Off,
            },
            {
                name: "Track",
                value: LoopMode.Track,
            },
            {
                name: "Queue",
                value: LoopMode.Queue,
            },
        ] as const,
        locales: {
            name: "locales.loop.option.name",
            description: "locales.loop.option.description",
        },
    }),
};

@Declare({
    name: "loop",
    description: "Toggle the loop mode.",
    integrationTypes: [ApplicationIntegrationType.GuildInstall],
    contexts: [InteractionContextType.Guild],
    aliases: ["l"],
})
@StelleOptions({ cooldown: 5, category: StelleCategory.Music })
@Options(options)
@LocalesT("locales.loop.name", "locales.loop.description")
@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer"])
export default class LoopCommand extends Command {
    public override async run(ctx: GuildCommandContext<typeof options, "checkPlayer">): Promise<void> {
        const { options } = ctx;

        const { messages } = await ctx.locale();

        const { player } = ctx.metadata.checkPlayer;

        const mode: LoopMode = options.mode ?? loopModes[player.loop];

        await player.setLoop(mode);
        await ctx.successReply(
            messages.commands.loop.toggled({
                type: messages.commands.loop.loopType[StelleMusic.LoopMode(player.loop, true)],
            }),
        );
    }
}
