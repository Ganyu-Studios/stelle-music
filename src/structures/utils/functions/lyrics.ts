import type { LyricsResult } from "lavalink-client";
import { ActionRow, type AnyContext, Button, Embed, type Message, type WebhookMessage } from "seyfert";
import { EmbedColors } from "seyfert/lib/common/index.js";
import { ButtonStyle, MessageFlags } from "seyfert/lib/types/index.js";
import { ms } from "#stelle/utils/functions/time.js";

/**
 *
 * Displays the lyrics of the current track in the guild.
 * @param {AnyContext} ctx The context of the command.
 * @returns {Promise<void | Message | WebhookMessage>} The message with the lyrics.
 */
export async function displayLyrics(ctx: AnyContext): Promise<void | Message | WebhookMessage> {
    if (!ctx.inGuild()) return;

    const { client } = ctx;

    const player = client.manager.getPlayer(ctx.guildId);
    if (!player) return;

    const track = player.queue.current;
    if (!track) return;

    await ctx.deferReply();

    const { messages } = await ctx.locale();

    const lyrics: LyricsResult | null =
        player.get<LyricsResult | undefined>("lyrics") ??
        (await player
            .getCurrentLyrics()
            .then((lyrics) => {
                if (!lyrics) return null;

                if (typeof lyrics.provider !== "string") lyrics.provider = "Unknown";
                if (typeof lyrics.sourceName !== "string") lyrics.sourceName = "Unknown";

                lyrics.provider = lyrics.provider.replace("Source:", "").trim();
                lyrics.sourceName = lyrics.sourceName.replace("Source:", "").trim();

                player.set("lyrics", lyrics);

                return lyrics;
            })
            .catch(() => null));

    if (!lyrics)
        return ctx.editOrReply({
            flags: MessageFlags.Ephemeral,
            embeds: [
                {
                    color: EmbedColors.Red,
                    description: messages.commands.lyrics.noLyrics,
                },
            ],
        });

    const lines = lyrics.lines
        .map((line) => {
            if (!line.line.length) line.line = "...";
            return line.line;
        })
        .join("\n");

    const embed = new Embed()
        .setThumbnail(track.info.artworkUrl ?? undefined)
        .setColor(client.config.color.extra)
        .setTitle(messages.commands.lyrics.embed.title({ title: track.info.title }))
        .setFooter({
            iconUrl: ctx.author.avatarURL(),
            text: messages.commands.lyrics.embed.footer({ userName: ctx.author.tag }),
        })
        .setDescription(
            messages.commands.lyrics.embed.description({
                lines,
                author: track.info.author,
                provider: lyrics.provider,
            }),
        );

    const row: ActionRow<Button> = new ActionRow<Button>().addComponents(
        new Button().setCustomId("player-syncLyrics").setLabel(messages.commands.lyrics.sync).setStyle(ButtonStyle.Primary),
        new Button().setCustomId("player-lyricsDelete").setLabel(messages.commands.lyrics.close).setStyle(ButtonStyle.Secondary),
    );

    const message: WebhookMessage | Message = await ctx.editOrReply({ embeds: [embed], components: [row] }, true);
    const collector = message.createComponentCollector({
        filter: (i) => i.user.id === ctx.author.id,
        idle: ms("1min"),
        async onPass(interaction) {
            await interaction.editOrReply({
                content: "",
                flags: MessageFlags.Ephemeral,
                embeds: [
                    {
                        color: EmbedColors.Red,
                        description: messages.events.noCollector({ userId: ctx.author.id }),
                    },
                ],
            });
        },
    });

    collector.run("player-syncLyrics", async (interaction) => {
        const isEnabled = !!player.get("lyricsEnabled");
        if (!isEnabled) await player.subscribeLyrics();

        const lines = lyrics.lines
            .map((line) => `-# ${line.line}`)
            .slice(0, client.config.lyricsLines)
            .join("\n");

        embed.setDescription(
            messages.commands.lyrics.embed.description({
                lines,
                author: track.info.author,
                provider: lyrics.provider,
            }),
        );

        player.set("lyricsId", message.id);
        player.set("lyricsEnabled", true);

        const row: ActionRow<Button> = new ActionRow<Button>().addComponents(
            new Button().setCustomId("player-lyricsDelete").setLabel(messages.commands.lyrics.close).setStyle(ButtonStyle.Secondary),
        );

        await interaction.update({ embeds: [embed], components: [row] }).catch(() => null);

        collector.stop();
    });
}
