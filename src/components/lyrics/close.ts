import { ComponentCommand, type GuildComponentContext, Middlewares } from "seyfert";

@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer", "checkTracks"])
export default class LyricsComponent extends ComponentCommand {
    override componentType = "Button" as const;
    override customId = "player-lyricsClose";

    async run(ctx: GuildComponentContext<typeof this.componentType>): Promise<void> {
        const { client } = ctx;

        const player = client.manager.getPlayer(ctx.guildId);
        if (!player) return;

        const track = player.queue.current;
        if (!track) return;

        await ctx.deferUpdate();
        await ctx.deleteResponse();

        if (player.get<boolean | undefined>("lyricsEnabled")) await player.node.lyrics.unsubscribe(player.guildId).catch(() => null);

        player.set("lyricsId", undefined);
        player.set("lyrics", undefined);
    }
}
