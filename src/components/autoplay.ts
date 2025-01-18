import { type Button, ComponentCommand, type ComponentContext, Middlewares } from "seyfert";
import { editRows, getAutoplayState } from "#stelle/utils/functions/utils.js";

@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer", "checkTracks"])
export default class AutoplayComponent extends ComponentCommand {
    componentType = "Button" as const;

    filter(ctx: ComponentContext<typeof this.componentType>): boolean {
        return ctx.customId === "player-toggleAutoplay";
    }

    async run(ctx: ComponentContext<typeof this.componentType>) {
        const { client, guildId } = ctx;

        if (!guildId) return;

        const { messages } = await ctx.getLocale();

        const player = client.manager.getPlayer(guildId);
        if (!player) return;

        player.set("enabledAutoplay", !player.get("enabledAutoplay"));

        const isAutoplay = player.get<boolean>("enabledAutoplay");

        await ctx.interaction.deferUpdate();
        await ctx.interaction.message.edit({
            components: editRows<Button>(ctx.interaction.message.components, {
                customId: "player-toggleAutoplay",
                label: messages.events.trackStart.components.autoplay({
                    type: messages.commands.autoplay.autoplayType[getAutoplayState(isAutoplay)],
                }),
            }),
        });
    }
}
