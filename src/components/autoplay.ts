import { ComponentCommand, type GuildComponentContext, Middlewares } from "seyfert";
import { editButtonComponents } from "#stelle/utils/functions/utils.js";

import { Constants } from "#stelle/utils/data/constants.js";

@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer", "checkTracks"])
export default class AutoplayComponent extends ComponentCommand {
    override componentType = "Button" as const;
    override customId = "player-toggleAutoplay";

    async run(ctx: GuildComponentContext<typeof this.componentType>): Promise<void> {
        const { client } = ctx;

        const { messages } = await ctx.getLocale();

        const player = client.manager.getPlayer(ctx.guildId);
        if (!player) return;

        player.set("enabledAutoplay", !player.get("enabledAutoplay"));

        const isAutoplay = player.get<boolean>("enabledAutoplay");

        await ctx.interaction.deferUpdate();
        await ctx.interaction.message.edit({
            components: editButtonComponents(ctx.interaction.message.components, {
                customId: "player-toggleAutoplay",
                label: messages.events.trackStart.components.autoplay({
                    type: messages.commands.autoplay.autoplayType[Constants.AutoplayState(isAutoplay)],
                }),
            }),
        });
    }
}
