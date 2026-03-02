import type { PlayerStructure } from "hoshimi";
import { Command, Declare, type GuildCommandContext, LocalesT, Middlewares } from "seyfert";
import { StelleCategory } from "#stelle/types";
import { StelleOptions } from "#stelle/utils/decorator.js";

@Declare({
    name: "stop",
    description: "Stop the player.",
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"],
    aliases: ["destroy", "leave"],
})
@StelleOptions({ cooldown: 5, category: StelleCategory.Music })
@LocalesT("locales.stop.name", "locales.stop.description")
@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer"])
export default class StopCommand extends Command {
    public override async run(ctx: GuildCommandContext): Promise<void> {
        const { client } = ctx;

        const { messages } = await ctx.locale();

        const player: PlayerStructure | undefined = client.manager.getPlayer(ctx.guildId);
        if (!player) return;

        await player.destroy();
        await ctx.editOrReply({
            embeds: [
                {
                    description: messages.commands.stop,
                    color: client.config.color.success,
                },
            ],
        });
    }
}
