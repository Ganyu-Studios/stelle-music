import { Command, Declare, type GuildCommandContext, LocalesT, Middlewares } from "seyfert";
import { StelleOptions } from "#stelle/utils/decorator.js";

import { StelleCategory } from "#stelle/types";
import { Constants } from "#stelle/utils/data/constants.js";

@Declare({
    name: "autoplay",
    description: "Toggle the autoplay.",
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"],
    aliases: ["auto", "ap"],
})
@StelleOptions({
    cooldown: 5,
    category: StelleCategory.Music,
})
@LocalesT("locales.autoplay.name", "locales.autoplay.description")
@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer", "checkTracks"])
export default class AutoplayCommand extends Command {
    public override async run(ctx: GuildCommandContext): Promise<void> {
        const { client } = ctx;

        const { messages } = await ctx.getLocale();

        const player = client.manager.getPlayer(ctx.guildId);
        if (!player) return;

        player.set("enabledAutoplay", !player.get("enabledAutoplay"));

        const isAutoplay = player.get<boolean>("enabledAutoplay");

        await ctx.editOrReply({
            embeds: [
                {
                    color: client.config.color.success,
                    description: messages.commands.autoplay.toggled({
                        type: messages.commands.autoplay.autoplayType[Constants.AutoplayState(isAutoplay)],
                    }),
                },
            ],
        });
    }
}
