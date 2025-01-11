import { type ComponentContext, ComponentCommand, Middlewares, type User, Embed } from "seyfert";
import { EmbedPaginator } from "#stelle/utils/Paginator.js";
import { MessageFlags } from "seyfert/lib/types/index.js";

@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer", "checkQueue"])
export default class QueueComponent extends ComponentCommand {
    componentType = "Button" as const;

    async run(ctx: ComponentContext<typeof this.componentType>): Promise<void> {
        const { client, author } = ctx;

        const guild = await ctx.guild();
        if (!guild) {
            return;
        }

        const { messages } = await ctx.getLocale();

        const player = client.manager.getPlayer(guild.id);
        if (!player) {
            return;
        }

        const tracksPerPage = 20;
        const tracks = player.queue.tracks.map(
            (track, i) => `#${i + 1}. [\`${track.info.title}\`](${track.info.uri}) - ${(track.requester as User).tag}`
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
                        .setAuthor({
                            name: author.tag,
                            iconUrl: author.avatarURL()
                        })
                ]
            });
        } else {
            const paginator = new EmbedPaginator(ctx);

            for (let i = 0; i < tracks.length; i += tracksPerPage) {
                paginator.addEmbed(
                    new Embed()
                        .setDescription(messages.events.playerQueue({ tracks: tracks.slice(i, i + tracksPerPage).join("\n") }))
                        .setColor(client.config.color.extra)
                        .setThumbnail(guild.iconURL())
                        .setTimestamp()
                        .setAuthor({
                            name: author.tag,
                            iconUrl: author.avatarURL()
                        })
                );

                await paginator.reply(true);
            }
        }
    }

    filter(ctx: ComponentContext<typeof this.componentType>): boolean {
        return ctx.customId === "player-guildQueue";
    }
}
