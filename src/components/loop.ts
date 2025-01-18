import { type Button, ComponentCommand, type ComponentContext, Middlewares } from "seyfert";
import { editRows, getLoopState } from "#stelle/utils/functions/utils.js";

@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer"])
export default class ToggleLoopComponent extends ComponentCommand {
    componentType = "Button" as const;

    filter(ctx: ComponentContext<typeof this.componentType>): boolean {
        return ctx.customId === "player-toggleLoop";
    }

    async run(ctx: ComponentContext<typeof this.componentType>): Promise<void> {
        const { client } = ctx;

        if (!ctx.guildId) return;

        const player = client.manager.getPlayer(ctx.guildId);
        if (!player) return;

        const { messages } = await ctx.getLocale();

        await player.setRepeatMode(getLoopState(player.repeatMode));

        await ctx.interaction.deferUpdate();
        await ctx.interaction.message.edit({
            components: editRows<Button>(ctx.interaction.message.components, {
                customId: "player-toggleLoop",
                label: messages.events.trackStart.components.loop({
                    type: messages.commands.loop.loopType[player.repeatMode],
                }),
            }),
        });
    }
}
