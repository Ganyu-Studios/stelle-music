import { type Button, ComponentCommand, type ComponentContext, Middlewares } from "seyfert";

import { ButtonStyle } from "seyfert/lib/types/index.js";
import { editRows, getPauseState } from "#stelle/utils/functions/utils.js";

@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer"])
export default class PauseTrackComponent extends ComponentCommand {
    componentType = "Button" as const;

    filter(ctx: ComponentContext<typeof this.componentType>): boolean {
        return ctx.customId === "player-pauseTrack";
    }

    async run(ctx: ComponentContext<typeof this.componentType>) {
        const { client, guildId } = ctx;

        if (!guildId) return;

        const { messages } = await ctx.getLocale();

        const player = client.manager.getPlayer(guildId);
        if (!player) return;

        await player[player.paused ? "resume" : "pause"]();

        await ctx.interaction.deferUpdate();
        await ctx.interaction.message.edit({
            components: editRows<Button>(ctx.interaction.message.components, {
                customId: "player-pauseTrack",
                label: messages.events.trackStart.components.paused[getPauseState(player.paused)],
                style: player.paused ? ButtonStyle.Secondary : ButtonStyle.Primary,
            }),
        });
    }
}
