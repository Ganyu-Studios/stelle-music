import { ComponentCommand, type ComponentContext, Middlewares } from "seyfert";

@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer", "checkQueue"])
export default class SkipTrackComponent extends ComponentCommand {
    componentType = "Button" as const;

    filter(ctx: ComponentContext<typeof this.componentType>): boolean {
        return ctx.customId === "player-skipTrack";
    }

    async run(ctx: ComponentContext<typeof this.componentType>): Promise<void> {
        const { client, guildId } = ctx;

        if (!guildId) return;

        const player = client.manager.getPlayer(guildId);
        if (!player) return;

        await player.skip(undefined, !player.get("enabledAutoplay"));
        await ctx.interaction.deferUpdate();
        await ctx.interaction.message.edit({ components: [] });
    }
}
