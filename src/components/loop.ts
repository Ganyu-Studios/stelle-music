import type { PlayerStructure } from "hoshimi";
import { ComponentCommand, type GuildComponentContext, Middlewares } from "seyfert";
import { Constants } from "#stelle/utils/data/constants.js";
import { updateComponents } from "#stelle/utils/functions/utils.js";

@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer"])
export default class ToggleLoopComponent extends ComponentCommand {
    override componentType = "Button" as const;
    override customId = "player-toggleLoop";

    async run(ctx: GuildComponentContext<typeof this.componentType>): Promise<void> {
        const { client } = ctx;

        const player: PlayerStructure | undefined = client.manager.getPlayer(ctx.guildId);
        if (!player) return;

        const { messages } = await ctx.locale();

        await player.setLoop(Constants.LoopMode(player.loop));

        await ctx.interaction.deferUpdate();
        await ctx.interaction.message.edit({
            components: updateComponents(ctx.interaction.message, {
                customId: "player-toggleLoop",
                label: messages.events.trackStart.components.loop({
                    type: messages.commands.loop.loopType[player.loop],
                }),
            }),
        });
    }
}
