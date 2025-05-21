import { ComponentCommand, type GuildComponentContext, Middlewares } from "seyfert";

@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer", "checkTracks"])
export default class LyricsDeleteComponent extends ComponentCommand {
    override componentType = "Button" as const;
    override customId = "player-lyricsDelete";

    async run(ctx: GuildComponentContext<typeof this.componentType>): Promise<void> {
        const { client } = ctx;

        const player = client.manager.getPlayer(ctx.guildId);
        if (!player) return;

        const track = player.queue.current;
        if (!track) return;

        await ctx.deferUpdate();
        await ctx.deleteResponse();

        player.set("lyricsEnabled", undefined);
        player.set("lyricsId", undefined);
    }
}
