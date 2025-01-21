import { ComponentCommand, type GuildComponentContext, Middlewares } from "seyfert";

import { ButtonStyle } from "seyfert/lib/types/index.js";
import { editButtons, getPauseState } from "#stelle/utils/functions/utils.js";

@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer"])
export default class PauseTrackComponent extends ComponentCommand {
    componentType = "Button" as const;

    filter(ctx: GuildComponentContext<typeof this.componentType>): boolean {
        return ctx.customId === "player-pauseTrack";
    }

    async run(ctx: GuildComponentContext<typeof this.componentType>) {
        const { client } = ctx;

        const { messages } = await ctx.getLocale();

        const player = client.manager.getPlayer(ctx.guildId);
        if (!player) return;

        await player[player.paused ? "resume" : "pause"]();

        await ctx.interaction.deferUpdate();
        await ctx.interaction.message.edit({
            components: editButtons(ctx.interaction.message.components, {
                customId: "player-pauseTrack",
                label: messages.events.trackStart.components.paused[getPauseState(player.paused)],
                style: player.paused ? ButtonStyle.Secondary : ButtonStyle.Primary,
            }),
        });
    }
}
