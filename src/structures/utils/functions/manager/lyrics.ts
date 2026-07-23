import type { LyricsResult, PlayerStructure, TrackStructure } from "hoshimi";
import {
    ActionRow,
    type AnyContext,
    Button,
    type DefaultLocale,
    Embed,
    type MessageStructure,
    type UsingClient,
    type WebhookMessageStructure,
} from "seyfert";
import { EmbedColors } from "seyfert/lib/common/index.js";
import type { CollectorInteraction, CreateComponentCollectorResult } from "seyfert/lib/components/handler.js";
import { ButtonStyle, MessageFlags } from "seyfert/lib/types/index.js";
import { ms } from "#stelle/utils/functions/internal/time.js";

/**
 * The options for the sync response.
 */
interface SyncResponseOptions {
    /**
     * The interaction to respond to.
     * @type {CollectorInteraction}
     */
    interaction: CollectorInteraction;
    /**
     * The embed to update.
     * @type {Embed}
     */
    embed: Embed;
    /**
     * The lyrics result for the current track.
     * @type {LyricsResult}
     */
    lyrics: LyricsResult;
    /**
     * The current track.
     * @type {TrackStructure}
     */
    track: TrackStructure;
    /**
     * The guild player.
     * @type {PlayerStructure}
     */
    player: PlayerStructure;
    /**
     * The message id to store for updates.
     * @type {string}
     */
    messageId: string;
    /**
     * The resolved locale messages.
     * @type {DefaultLocale["messages"]}
     */
    messages: DefaultLocale["messages"];
    /**
     * The client instance.
     * @type {UsingClient}
     */
    client: UsingClient;
}

/**
 *
 * Updates the lyrics embed with synced lines and stores the new message id. Shared by both the
 * first-time subscribe path and the reconnect path (when the subscription is already active).
 * @param options The options for the sync response.
 * @returns A promise that resolves once the response is sent.
 */
async function syncResponse(options: SyncResponseOptions): Promise<void> {
    const { interaction, embed, lyrics, track, player, messageId, messages, client } = options;
    const syncedLines: string = lyrics.lines
        .map((line): string => `-# ${line.line}`)
        .slice(0, client.config.lyricsLines)
        .join("\n");

    embed.setDescription(
        messages.commands.lyrics.embed.description({
            lines: syncedLines,
            author: track.info.author,
            provider: lyrics.provider,
        }),
    );

    const row: ActionRow<Button> = new ActionRow<Button>().addComponents(
        new Button().setCustomId("player-lyricsDelete").setLabel(messages.commands.lyrics.components.close).setStyle(ButtonStyle.Secondary),
    );

    await interaction.editResponse({ embeds: [embed], components: [row] });
    await interaction.followup({
        flags: MessageFlags.Ephemeral,
        embeds: [
            {
                color: client.config.color.success,
                description: messages.commands.lyrics.synced,
            },
        ],
    });

    await player.data.set("lyricsId", messageId);
}

/**
 *
 * Cleans the lyrics object and saves it to the player data.
 * @param {PlayerStructure} player The guild player.
 * @param {LyricsResult} lyrics The lyrics object to clean and save.
 * @returns {Promise<LyricsResult>} The cleaned lyrics object.
 */
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
 * @returns {Promise<void | MessageStructure | WebhookMessageStructure>} The message with the lyrics.
 */
export async function displayLyrics(ctx: AnyContext): Promise<void | MessageStructure | WebhookMessageStructure> {
    if (!ctx.inGuild()) return;

    const { client } = ctx;

    const player: PlayerStructure | undefined = ctx.getPlayer();
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
                    if (typeof error.trace === "string" && error.trace.toLowerCase().includes("response code from channel info is 400")) {
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

    if (!lyrics) return ctx.errorReply(messages.commands.lyrics.noLyrics, { ephemeral: true });

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
        new Button().setCustomId("player-syncLyrics").setLabel(messages.commands.lyrics.components.sync).setStyle(ButtonStyle.Primary),
        new Button().setCustomId("player-lyricsDelete").setLabel(messages.commands.lyrics.components.close).setStyle(ButtonStyle.Secondary),
    );

    const message: WebhookMessageStructure | MessageStructure = await ctx.editOrReply({ embeds: [embed], components: [row] }, true);
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
                        description: messages.events.onlyUser({ userId: ctx.author.id }),
                    },
                ],
            });
        },
    });

    collector.run("player-syncLyrics", async (interaction): Promise<void> => {
        await interaction.deferUpdate();

        const isEnabled: boolean = !!(await player.data.get("lyricsEnabled"));

        if (isEnabled) {
            await syncResponse({ interaction, embed, lyrics, track, player, messageId: message.id, messages, client });

            collector.stop();

            return;
        }

        try {
            await player.lyrics.subscribe(skipTrackSource);

            await syncResponse({ interaction, embed, lyrics, track, player, messageId: message.id, messages, client });

            await player.data.set("lyricsEnabled", true);
        } catch {
            await interaction.followup({
                embeds: [
                    {
                        color: EmbedColors.Red,
                        description: messages.commands.lyrics.error,
                    },
                ],
            });

            await message.delete().catch((): null => null);
        } finally {
            collector.stop();
        }
    });
}
