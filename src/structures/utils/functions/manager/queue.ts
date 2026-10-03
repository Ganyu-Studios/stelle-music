import type { PlayerStructure } from "hoshimi";
import { type AnyContext, Embed, type Guild } from "seyfert";
import { MessageFlags } from "seyfert/lib/types/index.js";
import { EmbedPaginator } from "#stelle/classes/components/EmbedPaginator.js";

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
        (track, i): string => `#${i + 1}. [\`${track.info.title}\`](${track.info.uri}) - ${track.requester.tag}`,
    );

    // One embed for the slice of tracks starting at `start`.
    const page = (start: number): Embed =>
        new Embed()
            .setDescription(messages.events.player.queue({ tracks: tracks.slice(start, start + limit).join("\n") }))
            .setColor(client.config.color.extra)
            .setThumbnail(guild.iconURL())
            .setTimestamp()
            .setAuthor({ name: author.tag, iconUrl: author.avatarURL() });

    // A single page needs no paginator controls.
    if (tracks.length <= limit) {
        await ctx.editOrReply({ content: "", flags: MessageFlags.Ephemeral, embeds: [page(0)] });
        return;
    }

    const paginator: EmbedPaginator = new EmbedPaginator({ ctx });

    for (let i: number = 0; i < tracks.length; i += limit) paginator.addEmbed(page(i));

    await paginator.reply({ ephemeral: true });
}
