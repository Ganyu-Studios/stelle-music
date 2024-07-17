import { Command, type CommandContext, Declare, LocalesT } from "seyfert";
import { StelleOptions } from "#stelle/decorators";

import { AUTOPLAY_STATE } from "#stelle/data/Constants.js";

@Declare({
    name: "autoplay",
    description: "Toggle the autoplay.",
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"],
    aliases: ["auto", "ap"],
})
@StelleOptions({ cooldown: 5, checkPlayer: true, inVoice: true, sameVoice: true, moreTracks: true, checkNodes: true })
@LocalesT("locales.autoplay.name", "locales.autoplay.description")
export default class AutoplayCommand extends Command {
    async run(ctx: CommandContext) {
        const { client, guildId } = ctx;

        if (!guildId) return;

        const { messages } = await ctx.getLocale();

        const player = client.manager.getPlayer(guildId);
        if (!player) return;

        player.set("enabledAutoplay", !player.get("enabledAutoplay") ?? true);

        const isAutoplay = player.get<boolean>("enabledAutoplay");

        await ctx.editOrReply({
            embeds: [
                {
                    color: client.config.color.success,
                    description: messages.commands.autoplay.toggled({
                        type: messages.commands.autoplay.autoplayType[AUTOPLAY_STATE(isAutoplay)],
                    }),
                },
            ],
        });
    }
}
