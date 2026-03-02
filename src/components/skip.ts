import type { PlayerStructure } from "hoshimi";
import { ComponentCommand, type GuildComponentContext, Middlewares } from "seyfert";

@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer", "checkQueue"])
export default class SkipTrackComponent extends ComponentCommand {
    override componentType = "Button" as const;
    override customId = "player-skipTrack";

    async run(ctx: GuildComponentContext<typeof this.componentType>): Promise<void> {
        const { client } = ctx;

        const player: PlayerStructure | undefined = client.manager.getPlayer(ctx.guildId);
        if (!player) return;

        const isAutoplay: boolean | undefined = await player.data.get("enabledAutoplay");

        await player.skip({ throwError: !isAutoplay });
        await ctx.interaction.deferUpdate();

        if (client.config.deleter.onTrackSkip) await ctx.interaction.message.delete().catch((): null => null);
        else await ctx.interaction.message.edit({ components: [] });
    }
}
