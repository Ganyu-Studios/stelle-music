import type { LyricsResult, Player, Track } from "lavalink-client";
import { ActionRow, type AnyContext, Button, Embed, type Message, type WebhookMessage } from "seyfert";
import { EmbedColors } from "seyfert/lib/common/index.js";
import type { CreateComponentCollectorResult } from "seyfert/lib/components/handler.js";
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

    const player: Player | undefined = client.manager.getPlayer(ctx.guildId);
    if (!player) return;

    const track: Track | null = player.queue.current;
    if (!track) return;

    await ctx.deferReply();

    const { messages } = await ctx.locale();

    const lyrics: LyricsResult | null =
        player.get<LyricsResult | undefined>("lyrics") ??
        (await player
            .getCurrentLyrics()
            .then(async (lyrics): Promise<LyricsResult | null> => {
                let lyricsResult: LyricsResult | null = null;

                // If the lyrics object contains an error or trace property, it means an error occurred
                if ("error" in lyrics && "trace" in lyrics) {
                    // Fallback in case the response from the lyrics provider is a 400
                    // which means that the lyrics were not found
                    if (typeof lyrics.trace === "string" && lyrics.trace.includes("Response code from channel info is 400"))
                        lyricsResult = await player.getCurrentLyrics(true);
                }

                // If for some reason lyrics is null or undefined, we return null
                if (!lyricsResult) return null;

                if (typeof lyricsResult.provider !== "string") lyricsResult.provider = "Unknown";
                if (typeof lyricsResult.sourceName !== "string") lyricsResult.sourceName = "Unknown";

                lyricsResult.provider = lyricsResult.provider.replace("Source:", "").trim();
                lyricsResult.sourceName = lyricsResult.sourceName.replace("Source:", "").trim();

                console.info({ lyricsResult });

                player.set("lyrics", lyricsResult);

                return lyricsResult;
            })
            .catch((): null => null));

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

    const lines: string = lyrics.lines
        .map((line): string => {
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
    const collector: CreateComponentCollectorResult = message.createComponentCollector({
        filter: (i): boolean => i.user.id === ctx.author.id,
        idle: ms("1min"),
        async onPass(interaction): Promise<void> {
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

    collector.run("player-syncLyrics", async (interaction): Promise<void> => {
        const isEnabled: boolean = !!player.get("lyricsEnabled");
        if (!isEnabled) await player.subscribeLyrics().catch((): null => null);

        const lines: string = lyrics.lines
            .map((line): string => `-# ${line.line}`)
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

        await interaction.update({ embeds: [embed], components: [row] }).catch((): null => null);

        collector.stop();
    });
}
