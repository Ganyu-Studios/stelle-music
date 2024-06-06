import { ComponentCommand, type ComponentContext } from "seyfert";
import { StelleOptions } from "#stelle/decorators";

import { MessageFlags } from "discord-api-types/v10";
import { EmbedColors } from "seyfert/lib/common/index.js";

@StelleOptions({ inVoice: true, sameVoice: true, checkPlayer: true, cooldown: 5, checkNodes: true })
export default class PreviousTrackComponent extends ComponentCommand {
    componentType = "Button" as const;

    filter(ctx: ComponentContext<typeof this.componentType>): boolean {
        return ctx.customId === "player-previousTrack";
    }

    async run(ctx: ComponentContext<typeof this.componentType>) {
        const { client, guildId } = ctx;

        if (!guildId) return;

        const { messages } = ctx.t.get(await ctx.getLocale());

        const player = client.manager.getPlayer(guildId);
        if (!player) return;

        const track = player.getPrevious(true);
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

        player.queue.add(track);

        await ctx.editOrReply({
            flags: MessageFlags.Ephemeral,
            embeds: [
                {
                    description: messages.commands.previous({ title: track.title, uri: track.uri! }),
                    color: client.config.color.success,
                },
            ],
        });
    }
}
