import { Command, type CommandContext, Declare, LocalesT } from "seyfert";
import { StelleOptions } from "#stelle/decorators";

@Declare({
    name: "stop",
    description: "Stop the player.",
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"],
    aliases: ["sp"],
})
@StelleOptions({ cooldown: 5, checkPlayer: true, inVoice: true, sameVoice: true, checkNodes: true })
@LocalesT("locales.stop.name", "locales.stop.description")
export default class StopCommand extends Command {
    async run(ctx: CommandContext) {
        const { client, guildId } = ctx;

        if (!guildId) return;

        const { messages } = ctx.t.get(await ctx.getLocale());

        const player = client.manager.getPlayer(guildId);
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
