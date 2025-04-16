import { ComponentCommand, type GuildComponentContext, Middlewares } from "seyfert";

@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer"])
export default class StopComponent extends ComponentCommand {
    override componentType = "Button" as const;
    override customId = "player-stopPlayer";

    async run(ctx: GuildComponentContext<typeof this.componentType>): Promise<void> {
        const { client } = ctx;

        const player = client.manager.getPlayer(ctx.guildId);
        if (!player) return;

        await player.destroy();
        await ctx.interaction.deferUpdate();
        await ctx.interaction.message.edit({ components: [] });
    }
}
