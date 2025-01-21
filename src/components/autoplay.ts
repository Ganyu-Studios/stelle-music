import { ComponentCommand, type GuildComponentContext, Middlewares } from "seyfert";
import { editButtons, getAutoplayState } from "#stelle/utils/functions/utils.js";

@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer", "checkTracks"])
export default class AutoplayComponent extends ComponentCommand {
    componentType = "Button" as const;

    filter(ctx: GuildComponentContext<typeof this.componentType>): boolean {
        return ctx.customId === "player-toggleAutoplay";
    }

    async run(ctx: GuildComponentContext<typeof this.componentType>) {
        const { client } = ctx;

        const { messages } = await ctx.getLocale();

        const player = client.manager.getPlayer(ctx.guildId);
        if (!player) return;

        player.set("enabledAutoplay", !player.get("enabledAutoplay"));

        const isAutoplay = player.get<boolean>("enabledAutoplay");

        await ctx.interaction.deferUpdate();
        await ctx.interaction.message.edit({
            components: editButtons(ctx.interaction.message.components, {
                customId: "player-toggleAutoplay",
                label: messages.events.trackStart.components.autoplay({
                    type: messages.commands.autoplay.autoplayType[getAutoplayState(isAutoplay)],
                }),
            }),
        });
    }
}
