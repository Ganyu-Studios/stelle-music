import { ComponentCommand, type GuildComponentContext, Middlewares } from "seyfert";

@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer", "checkQueue"])
export default class SkipTrackComponent extends ComponentCommand {
    override componentType = "Button" as const;
    override customId = "player-skipTrack";

    async run(ctx: GuildComponentContext<typeof this.componentType>): Promise<void> {
        const { client } = ctx;

        const player = client.manager.getPlayer(ctx.guildId);
        if (!player) return;

        await player.skip(undefined, !player.get("enabledAutoplay"));
        await ctx.interaction.deferUpdate();
        await ctx.interaction.message.edit({ components: [] });
    }
}
