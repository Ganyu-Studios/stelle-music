import { ComponentCommand, type GuildComponentContext, Middlewares } from "seyfert";
import { StelleMusic } from "#stelle/utils/data/constants.js";
import { refreshComponents } from "#stelle/utils/functions/internal/components.js";

@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer"])
export default class ToggleLoopComponent extends ComponentCommand {
    override componentType = "Button" as const;
    override customId = "player-toggleLoop";

    async run(ctx: GuildComponentContext<typeof this.componentType, "checkPlayer">): Promise<void> {
        const { messages } = await ctx.locale();
        const { player } = ctx.metadata.checkPlayer;

        await player.setLoop(StelleMusic.LoopMode(player.loop));

        await refreshComponents(ctx, {
            customId: "player-toggleLoop",
            label: messages.events.trackStart.components.loop({
                type: messages.commands.loop.loopType[player.loop],
            }),
        });
    }
}
