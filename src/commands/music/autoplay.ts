import { type CommandContext, Middlewares, LocalesT, Command, Declare } from "seyfert";
import { getAutoplayState } from "#stelle/utils/functions/utils.js";
import { StelleOptions } from "#stelle/decorators";
import { StelleCategory } from "#stelle/types";

@Declare({
    name: "autoplay",
    description: "Toggle the autoplay.",
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"],
    aliases: ["auto", "ap"]
})
@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer", "checkTracks"])
@StelleOptions({
    cooldown: 5,
    category: StelleCategory.Music
})
@LocalesT("locales.autoplay.name", "locales.autoplay.description")
export default class AutoplayCommand extends Command {
    public override async run(ctx: CommandContext) {
        const { client, guildId } = ctx;

        if (!guildId) {
            return;
        }

        const { messages } = await ctx.getLocale();

        const player = client.manager.getPlayer(guildId);
        if (!player) {
            return;
        }

        player.set("enabledAutoplay", !player.get("enabledAutoplay"));

        const isAutoplay = player.get<boolean>("enabledAutoplay");

        await ctx.editOrReply({
            embeds: [
                {
                    color: client.config.color.success,
                    description: messages.commands.autoplay.toggled({
                        type: messages.commands.autoplay.autoplayType[getAutoplayState(isAutoplay)]
                    })
                }
            ]
        });
    }
}
