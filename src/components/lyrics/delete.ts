import type { PlayerStructure, TrackStructure } from "hoshimi";
import { ComponentCommand, type GuildComponentContext, Middlewares } from "seyfert";

@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer", "checkTracks"])
export default class LyricsDeleteComponent extends ComponentCommand {
    override componentType = "Button" as const;
    override customId = "player-lyricsDelete";

    async run(ctx: GuildComponentContext<typeof this.componentType>): Promise<void> {
        const { client } = ctx;

        const player: PlayerStructure | undefined = client.manager.getPlayer(ctx.guildId);
        if (!player) return;

        const track: TrackStructure | null = player.queue.current;
        if (!track) return;

        await ctx.deferUpdate();
        await ctx.deleteResponse().catch((): null => null);

        await player.data.delete("lyrics");
        await player.data.delete("lyricsId");
    }
}
