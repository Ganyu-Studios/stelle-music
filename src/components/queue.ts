import { MessageFlags } from "discord-api-types/v10";
import { ComponentCommand, type ComponentContext, Embed, type User } from "seyfert";
import { StelleOptions } from "#stelle/decorators";
import { EmbedPaginator } from "#stelle/utils/Paginator.js";

@StelleOptions({ inVoice: true, sameVoice: true, checkPlayer: true, checkQueue: true, cooldown: 5 })
export default class QueueComponent extends ComponentCommand {
    componentType = "Button" as const;

    filter(ctx: ComponentContext<typeof this.componentType>): boolean {
        return ctx.customId === "player-guildQueue";
    }

    async run(ctx: ComponentContext<typeof this.componentType>): Promise<void> {
        const { client, guildId, author } = ctx;

        if (!guildId) return;

        const { messages } = ctx.t.get(await ctx.getLocale());

        const player = client.manager.getPlayer(guildId);
        if (!player) return;

        const tracksPerPage = 20;
        const paginator = new EmbedPaginator(ctx);
        const tracks = player.queue.map((track, i) => `#${i + 1}. [\`${track.title}\`](${track.uri}) - ${(track.requester as User).tag}`);

        if (tracks.length < tracksPerPage) {
            await ctx.editOrReply({
                flags: MessageFlags.Ephemeral,
                embeds: [
                    new Embed()
                        .setDescription(messages.events.playerQueue({ tracks: tracks.slice(0, tracksPerPage).join("\n") }))
                        .setColor(client.config.color.extra)
                        .setThumbnail(ctx.guild()!.iconURL())
                        .setTimestamp()
                        .setAuthor({ name: author.tag, iconUrl: author.avatarURL() }),
                ],
            });
        } else {
            for (let i = 0; i < tracks.length; i += tracksPerPage) {
                paginator.addEmbed(
                    new Embed()
                        .setDescription(messages.events.playerQueue({ tracks: tracks.slice(i, i + tracksPerPage).join("\n") }))
                        .setColor(client.config.color.extra)
                        .setThumbnail(ctx.guild()!.iconURL())
                        .setTimestamp()
                        .setAuthor({ name: author.tag, iconUrl: author.avatarURL() }),
                );

                await paginator.reply(true);
            }
        }
    }
}
