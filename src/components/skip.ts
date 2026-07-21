import { ComponentCommand, type GuildComponentContext, Middlewares } from "seyfert";
import { applyDeleter } from "#stelle/utils/functions/internal/components.js";

@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer", "checkQueue"])
export default class SkipTrackComponent extends ComponentCommand {
    override componentType = "Button" as const;
    override customId = "player-skipTrack";

    async run(ctx: GuildComponentContext<typeof this.componentType, "checkPlayer">): Promise<void> {
        const { player } = ctx.metadata.checkPlayer;

        const isAutoplay: boolean | undefined = await player.data.get("enabledAutoplay");

        await player.skip({ throwError: !isAutoplay });
        await applyDeleter(ctx, "onTrackSkip");
    }
}
