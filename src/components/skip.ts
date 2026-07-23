import { ComponentCommand, type GuildComponentContext, Middlewares } from "seyfert";
import { ComponentOps } from "#stelle/utils/functions/internal/components.js";

@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer", "checkQueue"])
export default class SkipTrackComponent extends ComponentCommand {
    override componentType = "Button" as const;
    override customId = "player-skipTrack";

    async run(ctx: GuildComponentContext<typeof this.componentType, "checkPlayer">): Promise<void> {
        const { player } = ctx.metadata.checkPlayer;

        const isAutoplay: boolean | undefined = await player.data.get("enabledAutoplay");
        const isRequestChannel: boolean = !!(await player.data.get("isRequestChannel"));

        await player.skip({ throwError: !isAutoplay });

        // On a request channel the button lives on the persistent panel: never delete/clear it (the next track's start
        // refreshes it) — just acknowledge the interaction.
        if (isRequestChannel) await ctx.interaction.deferUpdate();
        else await ComponentOps.cleanup(ctx, "onTrackSkip");
    }
}
