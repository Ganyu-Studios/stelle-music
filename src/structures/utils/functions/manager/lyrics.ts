import type { LyricsResult, PlayerStructure, TrackStructure } from "hoshimi";
import { ActionRow, type AnyContext, Button, Embed, type Message, type WebhookMessage } from "seyfert";
import { EmbedColors } from "seyfert/lib/common/index.js";
import type { CreateComponentCollectorResult } from "seyfert/lib/components/handler.js";
import { ButtonStyle, MessageFlags } from "seyfert/lib/types/index.js";
import { ms } from "#stelle/utils/functions/time.js";

async function cleanLyrics(player: PlayerStructure, lyrics: LyricsResult): Promise<LyricsResult> {
    if (typeof lyrics.provider !== "string") lyrics.provider = "Unknown";
    if (typeof lyrics.sourceName !== "string") lyrics.sourceName = "Unknown";

    lyrics.provider = lyrics.provider.replace("Source:", "").trim();
    lyrics.sourceName = lyrics.sourceName.replace("Source:", "").trim();

    await player.data.set("lyrics", lyrics);

    return lyrics;
}

/**
 *
 * Displays the lyrics of the current track in the guild.
 * @param {AnyContext} ctx The context of the command.
 * @returns {Promise<void | Message | WebhookMessage>} The message with the lyrics.
 */
export async function displayLyrics(ctx: AnyContext): Promise<void | Message | WebhookMessage> {
    if (!ctx.inGuild()) return;

    const { client } = ctx;

    const player: PlayerStructure | undefined = client.manager.getPlayer(ctx.guildId);
    if (!player) return;

    const track: TrackStructure | null = player.queue.current;
    if (!track) return;

    await ctx.deferReply();

    const { messages } = await ctx.locale();

    let skipTrackSource: boolean = false;

    const lyrics: LyricsResult | null =
        (await player.data.get("lyrics")) ??
        (await player.lyrics
            .current()
            .then(async (lyrics): Promise<LyricsResult | null> => {
                // If for some reason lyrics is null or undefined, we return null
                if (!lyrics) return null;
                if (!lyrics.lines.length) return null;

                return cleanLyrics(player, lyrics);
            })
            .catch(async (error): Promise<LyricsResult | null> => {
                // If the lyrics object contains an error or trace property, it means an error occurred
                if ("error" in error && "trace" in error) {
                    // Fallback in case the response from the lyrics provider is a 400
                    // which means that the lyrics were not found
                    if (typeof error.trace === "string" && error.trace.includes("Response code from channel info is 400")) {
                        const lyrics: LyricsResult | null = await player.lyrics.current(true);
                        if (!lyrics) return null;
                        if (!lyrics.lines.length) return null;

                        // Since we get the lyrics from a fallback, we should skip the track source when subscribing to the lyrics
                        skipTrackSource = true;

                        return cleanLyrics(player, lyrics);
                    }

                    return null;
                }

                return null;
            }));

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
        const isEnabled: boolean = !!(await player.data.get("lyricsEnabled"));
        if (!isEnabled) await player.lyrics.subscribe(skipTrackSource).catch((): null => null);

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

        await player.data.set("lyricsId", message.id);
        await player.data.set("lyricsEnabled", true);

        const row: ActionRow<Button> = new ActionRow<Button>().addComponents(
            new Button().setCustomId("player-lyricsDelete").setLabel(messages.commands.lyrics.close).setStyle(ButtonStyle.Secondary),
        );

        await interaction.update({ embeds: [embed], components: [row] }).catch((): null => null);

        collector.stop();
    });
}
