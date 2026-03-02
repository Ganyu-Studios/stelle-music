import type { PlayerStructure, TrackStructure } from "hoshimi";
import { ComponentCommand, type GuildComponentContext, Middlewares } from "seyfert";

import { EmbedColors } from "seyfert/lib/common/index.js";
import { MessageFlags } from "seyfert/lib/types/index.js";

@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer"])
export default class PreviousTrackComponent extends ComponentCommand {
    override componentType = "Button" as const;
    override customId = "player-previousTrack";

    async run(ctx: GuildComponentContext<typeof this.componentType>): Promise<void> {
        const { client } = ctx;

        const { messages } = await ctx.locale();

        const player: PlayerStructure | undefined = client.manager.getPlayer(ctx.guildId);
        if (!player) return;

        const track: TrackStructure | null = await player.queue.previous();
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
