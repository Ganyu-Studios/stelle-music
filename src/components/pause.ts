import { ComponentCommand, type GuildComponentContext, Middlewares } from "seyfert";
import { ButtonStyle } from "seyfert/lib/types/index.js";
import { StelleMusic } from "#stelle/utils/data/constants.js";
import { updateComponents } from "#stelle/utils/functions/utils.js";

@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer"])
export default class PauseTrackComponent extends ComponentCommand {
    override componentType = "Button" as const;
    override customId = "player-pauseTrack";

    async run(ctx: GuildComponentContext<typeof this.componentType, "checkPlayer">): Promise<void> {
        const { messages } = await ctx.locale();
        const { player } = ctx.metadata.checkPlayer;

        await player.setPaused(!player.paused);

        await ctx.interaction.deferUpdate();
        await ctx.interaction.message.edit({
            components: updateComponents(ctx.interaction.message, {
                customId: "player-pauseTrack",
                label: messages.events.trackStart.components.states[StelleMusic.PauseState(player.paused)],
                style: player.paused ? ButtonStyle.Secondary : ButtonStyle.Primary,
            }),
        });
    }
}
