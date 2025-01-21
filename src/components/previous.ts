import { ComponentCommand, type GuildComponentContext, Middlewares } from "seyfert";

import { EmbedColors } from "seyfert/lib/common/index.js";
import { MessageFlags } from "seyfert/lib/types/index.js";

@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer"])
export default class PreviousTrackComponent extends ComponentCommand {
    componentType = "Button" as const;

    filter(ctx: GuildComponentContext<typeof this.componentType>): boolean {
        return ctx.customId === "player-previousTrack";
    }

    async run(ctx: GuildComponentContext<typeof this.componentType>) {
        const { client } = ctx;

        const { messages } = await ctx.getLocale();

        const player = client.manager.getPlayer(ctx.guildId);
        if (!player) return;

        const track = await player.queue.shiftPrevious();
        if (!track)
            return ctx.editOrReply({
                flags: MessageFlags.Ephemeral,
                embeds: [
                    {
                        description: messages.events.noPrevious,
                        color: EmbedColors.Red,
                    },
                ],
            });

        await player.queue.add(track);
        await ctx.editOrReply({
            flags: MessageFlags.Ephemeral,
            embeds: [
                {
                    description: messages.commands.previous({ title: track.info.title, uri: track.info.uri! }),
                    color: client.config.color.success,
                },
            ],
        });
    }
}
