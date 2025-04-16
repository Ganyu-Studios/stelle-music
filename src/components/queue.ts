import { ComponentCommand, Embed, type GuildComponentContext, Middlewares, type User } from "seyfert";
import { MessageFlags } from "seyfert/lib/types/index.js";

import { EmbedPaginator } from "#stelle/utils/paginator.js";

@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer", "checkQueue"])
export default class QueueComponent extends ComponentCommand {
    override componentType = "Button" as const;
    override customId = "player-guildQueue";

    async run(ctx: GuildComponentContext<typeof this.componentType>): Promise<void> {
        const { client, author } = ctx;

        const guild = await ctx.guild();

        const { messages } = await ctx.getLocale();

        const player = client.manager.getPlayer(guild.id);
        if (!player) return;

        const tracksPerPage = 20;
        const tracks = player.queue.tracks.map(
            (track, i) => `#${i + 1}. [\`${track.info.title}\`](${track.info.uri}) - ${(track.requester as User).tag}`,
        );

        if (tracks.length < tracksPerPage) {
            await ctx.editOrReply({
                flags: MessageFlags.Ephemeral,
                embeds: [
                    new Embed()
                        .setDescription(messages.events.playerQueue({ tracks: tracks.slice(0, tracksPerPage).join("\n") }))
                        .setColor(client.config.color.extra)
                        .setThumbnail(guild.iconURL())
                        .setTimestamp()
                        .setAuthor({ name: author.tag, iconUrl: author.avatarURL() }),
                ],
            });
        } else {
            const paginator = new EmbedPaginator({ ctx });

            for (let i = 0; i < tracks.length; i += tracksPerPage) {
                paginator.addEmbed(
                    new Embed()
                        .setDescription(messages.events.playerQueue({ tracks: tracks.slice(i, i + tracksPerPage).join("\n") }))
                        .setColor(client.config.color.extra)
                        .setThumbnail(guild.iconURL())
                        .setTimestamp()
                        .setAuthor({ name: author.tag, iconUrl: author.avatarURL() }),
                );

                await paginator.reply(true);
            }
        }
    }
}
