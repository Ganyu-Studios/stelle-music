import { ComponentCommand, Embed, type GuildComponentContext, Middlewares } from "seyfert";
import { MessageFlags } from "seyfert/lib/types/index.js";

import { EmbedPaginator } from "#stelle/utils/paginator.js";

@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer", "checkQueue"])
export default class QueueComponent extends ComponentCommand {
    override componentType = "Button" as const;
    override customId = "player-guildQueue";

    async run(ctx: GuildComponentContext<typeof this.componentType>): Promise<void> {
        const { client, author } = ctx;

        const guild = await ctx.guild();

        const { messages } = await ctx.locale();

        const player = client.manager.getPlayer(guild.id);
        if (!player) return;

        const amount = 20;
        const tracks = player.queue.tracks.map(
            (track, i) => `#${i + 1}. [\`${track.info.title}\`](${track.info.uri}) - ${track.requester!.tag}`,
        );

        if (tracks.length < amount) {
            await ctx.editOrReply({
                flags: MessageFlags.Ephemeral,
                embeds: [
                    new Embed()
                        .setDescription(messages.events.playerQueue({ tracks: tracks.slice(0, amount).join("\n") }))
                        .setColor(client.config.color.extra)
                        .setThumbnail(guild.iconURL())
                        .setTimestamp()
                        .setAuthor({ name: author.tag, iconUrl: author.avatarURL() }),
                ],
            });
        } else {
            const paginator = new EmbedPaginator({ ctx });

            for (let i = 0; i < tracks.length; i += amount) {
                paginator.addEmbed(
                    new Embed()
                        .setDescription(messages.events.playerQueue({ tracks: tracks.slice(i, i + amount).join("\n") }))
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
