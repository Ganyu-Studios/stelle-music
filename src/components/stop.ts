import { ComponentCommand, type GuildComponentContext, Middlewares } from "seyfert";
import { applyDeleter } from "#stelle/utils/functions/internal/discord.js";

@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer"])
export default class StopComponent extends ComponentCommand {
    override componentType = "Button" as const;
    override customId = "player-stopPlayer";

    async run(ctx: GuildComponentContext<typeof this.componentType, "checkPlayer">): Promise<void> {
        const { player } = ctx.metadata.checkPlayer;

        await player.destroy();
        await applyDeleter(ctx, "onPlayerStop");
    }
}
