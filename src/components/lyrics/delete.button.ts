import type { TrackStructure } from "hoshimi";
import { ComponentCommand, type GuildComponentContext, Middlewares } from "seyfert";

@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer", "checkTracks"])
export default class LyricsDeleteComponent extends ComponentCommand {
    override componentType = "Button" as const;
    override customId = "player-lyricsDelete";

    async run(ctx: GuildComponentContext<typeof this.componentType, "checkPlayer">): Promise<void> {
        const { player } = ctx.metadata.checkPlayer;

        const track: TrackStructure | null = player.queue.current;
        if (!track) return;

        await ctx.deferUpdate();
        await ctx.deleteResponse().catch((): null => null);

        await player.data.delete("lyrics");
        await player.data.delete("lyricsId");
    }
}
