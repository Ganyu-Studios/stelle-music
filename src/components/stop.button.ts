import { ComponentCommand, type GuildComponentContext, Middlewares } from "seyfert";
import { ComponentOps } from "#stelle/utils/functions/internal/components.js";

@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer"])
export default class StopComponent extends ComponentCommand {
    override componentType = "Button" as const;
    override customId = "player-stopPlayer";

    async run(ctx: GuildComponentContext<typeof this.componentType, "checkPlayer">): Promise<void> {
        const { player } = ctx.metadata.checkPlayer;

        const isRequestChannel: boolean = !!(await player.data.get("isRequestChannel"));

        await player.destroy();

        // On a request channel the button lives on the persistent panel: never delete/clear it (the destroy event
        // resets it to idle) — just acknowledge the interaction.
        if (isRequestChannel) await ctx.interaction.deferUpdate();
        else await ComponentOps.cleanup(ctx, "onPlayerStop");
    }
}
