import { ComponentCommand, type ComponentContext, Middlewares } from "seyfert";

@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer"])
export default class StopComponent extends ComponentCommand {
    componentType = "Button" as const;

    filter(ctx: ComponentContext<typeof this.componentType>): boolean {
        return ctx.customId === "player-stopPlayer";
    }

    async run(ctx: ComponentContext<typeof this.componentType>): Promise<void> {
        const { client, guildId } = ctx;

        if (!guildId) return;

        const player = client.manager.getPlayer(guildId);
        if (!player) return;

        await player.destroy();
        await ctx.interaction.deferUpdate();
        await ctx.interaction.message.edit({ components: [] });
    }
}
