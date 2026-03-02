import type { PlayerStructure } from "hoshimi";
import { type AnyContext, Embed, type Guild } from "seyfert";
import { MessageFlags } from "seyfert/lib/types/index.js";
import { EmbedPaginator } from "#stelle/utils/paginator.js";

/**
 *
 * Displays the queue of the player in an embed.
 * @param {AnyContext} ctx The context of the command.
 * @returns {Promise<void>} A promise that resolves when the embeds have been sent.
 */
export async function displayQueue(ctx: AnyContext): Promise<void> {
    if (!ctx.inGuild()) return;

    const { client, author } = ctx;

    const { messages } = await ctx.locale();

    const guild: Guild<"cached" | "api"> = await ctx.guild();

    const player: PlayerStructure | undefined = client.manager.getPlayer(guild.id);
    if (!player) return;

    const limit = 20;
    const tracks: string[] = player.queue.tracks.map(
        (track, i): string => `#${i + 1}. [\`${track.info.title}\`](${track.info.uri}) - ${track.requester!.tag}`,
    );

    if (tracks.length < limit) {
        await ctx.editOrReply({
            content: "",
            flags: MessageFlags.Ephemeral,
            embeds: [
                new Embed()
                    .setDescription(messages.events.playerQueue({ tracks: tracks.slice(0, limit).join("\n") }))
                    .setColor(client.config.color.extra)
                    .setThumbnail(guild.iconURL())
                    .setTimestamp()
                    .setAuthor({ name: author.tag, iconUrl: author.avatarURL() }),
            ],
        });
    } else {
        const paginator: EmbedPaginator = new EmbedPaginator({ ctx });

        for (let i: number = 0; i < tracks.length; i += limit) {
            paginator.addEmbed(
                new Embed()
                    .setDescription(messages.events.playerQueue({ tracks: tracks.slice(i, i + limit).join("\n") }))
                    .setColor(client.config.color.extra)
                    .setThumbnail(guild.iconURL())
                    .setTimestamp()
                    .setAuthor({ name: author.tag, iconUrl: author.avatarURL() }),
            );

            await paginator.reply(true);
        }
    }
}
