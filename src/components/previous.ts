import type { TrackStructure } from "hoshimi";
import { ComponentCommand, type GuildComponentContext, Middlewares } from "seyfert";

@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer"])
export default class PreviousTrackComponent extends ComponentCommand {
    override componentType = "Button" as const;
    override customId = "player-previousTrack";

    async run(ctx: GuildComponentContext<typeof this.componentType, "checkPlayer">): Promise<void> {
        const { messages } = await ctx.locale();
        const { player } = ctx.metadata.checkPlayer;

        const track: TrackStructure | null = await player.queue.previous();
        if (!track) return ctx.errorReply(messages.events.noPrevious, { ephemeral: true });

        await player.queue.add(track);
        await ctx.successReply(messages.commands.previous({ title: track.info.title, uri: track.info.uri! }), { ephemeral: true });
    }
}
