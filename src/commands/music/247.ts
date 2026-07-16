import { Command, createBooleanOption, Declare, type GuildCommandContext, LocalesT, Middlewares, Options } from "seyfert";
import { ApplicationIntegrationType, InteractionContextType } from "seyfert/lib/types/index.js";
import { type AutoplayState, StelleCategory } from "#stelle/types";
import { Constants } from "#stelle/utils/data/constants.js";
import { StelleOptions } from "#stelle/utils/decorator.js";

const options = {
    autopause: createBooleanOption({
        description: "Whether to auto-pause the player when everyone leaves the voice channel.",
        required: false,
        flag: true,
        locales: {
            name: "locales.twentyforseven.option.name",
            description: "locales.twentyforseven.option.description",
        },
    }),
};

@Declare({
    name: "247",
    description: "Toggles the 24/7 mode for the bot.",
    integrationTypes: [ApplicationIntegrationType.GuildInstall],
    contexts: [InteractionContextType.Guild],
    aliases: ["twentyfourseven", "alwaysonline", "alwayson"],
})
@StelleOptions({ category: StelleCategory.Music, cooldown: 10 })
@Middlewares(["checkNodes", "checkPlayer", "checkVoiceChannel", "checkVoicePermissions", "checkBotVoiceChannel"])
@LocalesT("locales.twentyforseven.name", "locales.twentyforseven.description")
@Options(options)
export default class TwentyFourSevenCommand extends Command {
    override async run(ctx: GuildCommandContext<typeof options, "checkPlayer">) {
        const { messages } = await ctx.locale();

        const { player } = ctx.metadata.checkPlayer;

        await player.data.set("is247", !(await player.data.get("is247")));
        await player.data.set("isAutoPause", ctx.options.autopause ?? false);

        const is247: boolean = (await player.data.get("is247"))!;
        const autoPause: boolean = (await player.data.get("isAutoPause"))!;

        /**
         *
         * Get the localized string for the autoplay state
         * @param {AutoplayState} state The autoplay state
         * @returns {string} The localized string for the autoplay state
         */
        const enabledState = (state: AutoplayState): string => messages.commands.is247.enabledType[state];

        await ctx.successReply(
            messages.commands.is247.enabled({
                is247: enabledState(Constants.AutoplayState(is247)),
                autoPause: enabledState(Constants.AutoplayState(autoPause)),
            }),
        );
    }
}
