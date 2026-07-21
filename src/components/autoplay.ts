import { ComponentCommand, type GuildComponentContext, Middlewares } from "seyfert";
import { StelleMusic } from "#stelle/utils/data/constants.js";
import { refreshComponents } from "#stelle/utils/functions/internal/components.js";

@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer", "checkTracks"])
export default class AutoplayComponent extends ComponentCommand {
    override componentType = "Button" as const;
    override customId = "player-toggleAutoplay";

    async run(ctx: GuildComponentContext<typeof this.componentType, "checkPlayer">): Promise<void> {
        const { messages } = await ctx.locale();
        const { player } = ctx.metadata.checkPlayer;

        await player.data.set("enabledAutoplay", !(await player.data.get("enabledAutoplay")));

        const isAutoplay: boolean = (await player.data.get("enabledAutoplay"))!;

        await refreshComponents(ctx, {
            customId: "player-toggleAutoplay",
            label: messages.events.trackStart.components.autoplay({
                type: messages.commands.autoplay.autoplayType[StelleMusic.AutoplayState(isAutoplay)],
            }),
        });
    }
}
