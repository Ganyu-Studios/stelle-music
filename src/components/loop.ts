import { ComponentCommand, type GuildComponentContext, Middlewares } from "seyfert";
import { Constants } from "#stelle/utils/data/constants.js";
import { editButtonComponents } from "#stelle/utils/functions/utils.js";

@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer"])
export default class ToggleLoopComponent extends ComponentCommand {
    override componentType = "Button" as const;
    override customId = "player-toggleLoop";

    async run(ctx: GuildComponentContext<typeof this.componentType>): Promise<void> {
        const { client } = ctx;

        const player = client.manager.getPlayer(ctx.guildId);
        if (!player) return;

        const { messages } = await ctx.getLocale();

        await player.setRepeatMode(Constants.LoopMode(player.repeatMode));

        await ctx.interaction.deferUpdate();
        await ctx.interaction.message.edit({
            components: editButtonComponents(ctx.interaction.message.components, {
                customId: "player-toggleLoop",
                label: messages.events.trackStart.components.loop({
                    type: messages.commands.loop.loopType[player.repeatMode],
                }),
            }),
        });
    }
}
