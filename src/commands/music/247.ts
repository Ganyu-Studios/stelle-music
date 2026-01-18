import { Command, createBooleanOption, Declare, type GuildCommandContext, LocalesT, Middlewares, Options } from "seyfert";
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
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"],
    aliases: ["twentyfourseven", "alwaysonline", "alwayson"],
})
@StelleOptions({ category: StelleCategory.Music, cooldown: 10 })
@Middlewares(["checkNodes", "checkPlayer", "checkVoiceChannel", "checkVoicePermissions", "checkBotVoiceChannel"])
@LocalesT("locales.twentyforseven.name", "locales.twentyforseven.description")
@Options(options)
export default class TwentyFourSevenCommand extends Command {
    override async run(ctx: GuildCommandContext<typeof options>) {
        const { client } = ctx;
        const { messages } = await ctx.locale();

        const player = client.manager.getPlayer(ctx.guildId);
        if (!player) return;

        player.set("is247", !player.get("is247"));
        player.set("isAutoPause", ctx.options.autopause ?? false);

        const is247 = player.get<boolean>("is247");
        const autoPause = player.get<boolean>("isAutoPause");

        /**
         *
         * Get the localized string for the autoplay state
         * @param {AutoplayState} state The autoplay state
         * @returns {string} The localized string for the autoplay state
         */
        const enabledState = (state: AutoplayState): string => messages.commands.is247.enabledType[state];

        await ctx.editOrReply({
            embeds: [
                {
                    color: client.config.color.success,
                    description: messages.commands.is247.enabled({
                        is247: enabledState(Constants.AutoplayState(is247)),
                        autoPause: enabledState(Constants.AutoplayState(autoPause)),
                    }),
                },
            ],
        });
    }
}
