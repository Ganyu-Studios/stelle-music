import type { PlayerStructure } from "hoshimi";
import { ComponentCommand, type GuildComponentContext, Middlewares } from "seyfert";
import { Constants } from "#stelle/utils/data/constants.js";
import { disableButtons } from "#stelle/utils/functions/utils.js";

@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer", "checkTracks"])
export default class AutoplayComponent extends ComponentCommand {
    override componentType = "Button" as const;
    override customId = "player-toggleAutoplay";

    async run(ctx: GuildComponentContext<typeof this.componentType>): Promise<void> {
        const { client } = ctx;

        const { messages } = await ctx.locale();

        const player: PlayerStructure | undefined = client.manager.getPlayer(ctx.guildId);
        if (!player) return;

        await player.data.set("enabledAutoplay", !(await player.data.get("enabledAutoplay")));

        const isAutoplay = (await player.data.get("enabledAutoplay"))!;

        await ctx.interaction.deferUpdate();
        await ctx.interaction.message.edit({
            components: disableButtons(ctx.interaction.message.components, {
                customId: "player-toggleAutoplay",
                label: messages.events.trackStart.components.autoplay({
                    type: messages.commands.autoplay.autoplayType[Constants.AutoplayState(isAutoplay)],
                }),
            }),
        });
    }
}
