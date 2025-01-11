import { type ComponentContext, ComponentCommand, Middlewares } from "seyfert";

@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer", "checkQueue"])
export default class SkipTrackComponent extends ComponentCommand {
    componentType = "Button" as const;

    async run(ctx: ComponentContext<typeof this.componentType>): Promise<void> {
        const { client, guildId } = ctx;

        if (!guildId) {
            return;
        }

        const player = client.manager.getPlayer(guildId);
        if (!player) {
            return;
        }

        await player.skip(undefined, !player.get("enabledAutoplay"));
        await ctx.interaction.deferUpdate();
        await ctx.interaction.message.edit({ components: [] });
    }

    filter(ctx: ComponentContext<typeof this.componentType>): boolean {
        return ctx.customId === "player-skipTrack";
    }
}
