import { Command, Declare, Embed, type GuildCommandContext, LocalesT, Middlewares } from "seyfert";
import { StelleOptions } from "#stelle/utils/decorator.js";

import { StelleCategory, type StelleUser } from "#stelle/types";
import { EmbedPaginator } from "#stelle/utils/paginator.js";

@Declare({
    name: "queue",
    description: "See the queue.",
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"],
})
@StelleOptions({
    cooldown: 5,
    category: StelleCategory.Music,
})
@LocalesT("locales.queue.name", "locales.queue.description")
@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer", "checkQueue"])
export default class QueueCommand extends Command {
    public override async run(ctx: GuildCommandContext): Promise<void> {
        const { client, author } = ctx;

        const { messages } = await ctx.getLocale();

        const guild = await ctx.guild();

        const player = client.manager.getPlayer(guild.id);
        if (!player) return;

        const tracksPerPage = 20;
        const tracks = player.queue.tracks.map(
            (track, i) => `#${i + 1}. [\`${track.info.title}\`](${track.info.uri}) - ${(track.requester as StelleUser).tag}`,
        );

        if (tracks.length < tracksPerPage) {
            await ctx.editOrReply({
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

                await paginator.reply();
            }
        }
    }
}
