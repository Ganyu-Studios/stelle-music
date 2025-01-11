import { type CommandContext, Middlewares, type User, LocalesT, Command, Declare, Embed } from "seyfert";
import { EmbedPaginator } from "#stelle/utils/Paginator.js";
import { StelleOptions } from "#stelle/decorators";
import { StelleCategory } from "#stelle/types";

@Declare({
    name: "queue",
    description: "See the queue.",
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"]
})
@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer", "checkQueue"])
@StelleOptions({
    cooldown: 5,
    category: StelleCategory.Music
})
@LocalesT("locales.queue.name", "locales.queue.description")
export default class QueueCommand extends Command {
    public override async run(ctx: CommandContext) {
        const { client, author } = ctx;

        const { messages } = await ctx.getLocale();

        const guild = await ctx.guild();
        if (!guild) {
            return;
        }

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

                await paginator.reply();
            }
        }
    }
}
