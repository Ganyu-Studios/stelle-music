import { ComponentCommand, type GuildComponentContext, Middlewares } from "seyfert";
import { Constants } from "#stelle/utils/data/constants.js";
import { updateComponents } from "#stelle/utils/functions/utils.js";

@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer", "checkTracks"])
export default class AutoplayComponent extends ComponentCommand {
    override componentType = "Button" as const;
    override customId = "player-toggleAutoplay";

    async run(ctx: GuildComponentContext<typeof this.componentType, "checkPlayer">): Promise<void> {
        const { messages } = await ctx.locale();
        const { player } = ctx.metadata.checkPlayer;

        await player.data.set("enabledAutoplay", !(await player.data.get("enabledAutoplay")));

        const isAutoplay: boolean = (await player.data.get("enabledAutoplay"))!;

        await ctx.interaction.deferUpdate();
        await ctx.interaction.message.edit({
            components: updateComponents(ctx.interaction.message, {
                customId: "player-toggleAutoplay",
                label: messages.events.trackStart.components.autoplay({
                    type: messages.commands.autoplay.autoplayType[Constants.AutoplayState(isAutoplay)],
                }),
            }),
        });
    }
}
