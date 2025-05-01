import { ComponentCommand, type GuildComponentContext, Middlewares } from "seyfert";
import { ButtonStyle } from "seyfert/lib/types/index.js";

import { Constants } from "#stelle/utils/data/constants.js";
import { editButtonComponents } from "#stelle/utils/functions/utils.js";

import type { PausedState } from "#stelle/types";

@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer"])
export default class PauseTrackComponent extends ComponentCommand {
    override componentType = "Button" as const;
    override customId = "player-pauseTrack";

    async run(ctx: GuildComponentContext<typeof this.componentType>): Promise<void> {
        const { client } = ctx;

        const { messages } = await ctx.getLocale();

        const player = client.manager.getPlayer(ctx.guildId);
        if (!player) return;

        const state: PausedState = player.paused ? "resume" : "pause";
        await player[state]();

        await ctx.interaction.deferUpdate();
        await ctx.interaction.message.edit({
            components: editButtonComponents(ctx.interaction.message.components, {
                customId: "player-pauseTrack",
                label: messages.events.trackStart.components.paused[Constants.PauseState(player.paused)],
                style: player.paused ? ButtonStyle.Secondary : ButtonStyle.Primary,
            }),
        });
    }
}
