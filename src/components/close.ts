import { ComponentCommand, type ComponentContext, Middlewares } from "seyfert";

@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer", "checkTracks"])
export default class LyricsComponent extends ComponentCommand {
    componentType = "Button" as const;

    filter(ctx: ComponentContext<typeof this.componentType>): boolean {
        return ctx.customId === "player-lyricsClose";
    }

    async run(ctx: ComponentContext<typeof this.componentType>): Promise<void> {
        const { client } = ctx;

        if (!ctx.guildId) return;

        const player = client.manager.getPlayer(ctx.guildId);
        if (!player) return;

        const track = player.queue.current;
        if (!track) return;

        await ctx.deferUpdate();
        await ctx.deleteResponse();
        await player.node.request(`/sessions/${player.node.sessionId}/players/${player.guildId}/unsubscribe`).catch(() => null);

        player.set("lyricsId", undefined);
        player.set("lyrics", undefined);
    }
}
