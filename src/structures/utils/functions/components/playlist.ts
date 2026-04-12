import type { PlayerStructure, QueryResult, TrackStructure } from "hoshimi";
import {
    ActionRow,
    Button,
    type ButtonInteraction,
    type CommandContext,
    Embed,
    Label,
    type MessageStructure,
    Modal,
    type ModalSubmitInteraction,
    TextInput,
    type WebhookMessageStructure,
} from "seyfert";
import { EmbedColors } from "seyfert/lib/common/index.js";
import type { CreateComponentCollectorResult } from "seyfert/lib/components/handler.js";
import { ButtonStyle, MessageFlags, TextInputStyle } from "seyfert/lib/types/index.js";
import type { userPlaylist } from "#stelle/prisma";
import { ms } from "#stelle/utils/functions/time.js";
import { isUrl } from "#stelle/utils/functions/utils.js";

/**
 * Enum representing the type of save operation for playlist tracks.
 * @enum {string}
 */
export enum SaveType {
    Queue = "queue",
    Current = "current",
    URL = "url",
}

/**
 * Saves tracks to the user's playlist.
 * @param {CommandContext} ctx The command context.
 * @param {ButtonInteraction} interaction The component button interaction.
 * @param {userPlaylist} playlist The user's playlist.
 * @param {SaveType} type The type of save operation.
 * @returns {Promise<MessageStructure | WebhookMessageStructure | void>} The response message.
 */
async function playlistTrackSave(
    ctx: CommandContext,
    interaction: ButtonInteraction,
    playlist: userPlaylist,
    type: SaveType,
): Promise<MessageStructure | WebhookMessageStructure | void> {
    const { messages } = await ctx.locale();
    const { client } = ctx;

    if (!ctx.inGuild()) return;

    const player: PlayerStructure | undefined = client.manager.getPlayer(ctx.guildId);
    if (!player?.playing && ["queue", "current"].includes(type))
        return interaction.editOrReply({
            content: "",
            flags: MessageFlags.Ephemeral,
            embeds: [
                {
                    description: messages.events.noPlayer,
                    color: EmbedColors.Red,
                },
            ],
        });

    switch (type) {
        case SaveType.Queue: {
            const tracks = player!.queue.tracks
                .filter((track) => !playlist.tracks.some((t) => t.encoded === track.encoded))
                .map((t) => ({
                    encoded: t.encoded!,
                    requesterId: t.requester.id,
                }));

            playlist.tracks.push(...tracks);

            await client.database.playlist.set(interaction.user.id, playlist);
            await interaction.editOrReply({
                content: "",
                embeds: [
                    {
                        description: messages.commands.playlist.manage.save.saved({
                            type: messages.commands.playlist.manage.save.saveType[type],
                            amount: tracks.length,
                        }),
                    },
                ],
            });

            break;
        }

        case SaveType.Current: {
            const track: TrackStructure | null = player!.queue.current;
            if (!track) return;

            if (playlist.tracks.some((t) => t.encoded === track.encoded))
                return interaction.editOrReply({
                    content: "",
                    flags: MessageFlags.Ephemeral,
                    embeds: [
                        {
                            description: messages.commands.playlist.manage.save.alreadyExists,
                            color: EmbedColors.Red,
                        },
                    ],
                });

            playlist.tracks.push({
                encoded: track.encoded!,
                requesterId: track.requester.id,
            });

            await client.database.playlist.set(interaction.user.id, playlist);
            await interaction.editOrReply({
                content: "",
                flags: MessageFlags.Ephemeral,
                embeds: [
                    {
                        description: messages.commands.playlist.manage.save.saved({
                            type: messages.commands.playlist.manage.save.saveType[type],
                            amount: 1,
                        }),
                    },
                ],
            });

            break;
        }

        case SaveType.URL: {
            const modal: Modal = new Modal()
                .setTitle(messages.commands.playlist.manage.save.modal.title)
                .setCustomId("playlist-saveFromURL-modal")
                .addComponents(
                    new Label()
                        .setLabel(messages.commands.playlist.manage.save.modal.label.label)
                        .setDescription(messages.commands.playlist.manage.save.modal.label.description)
                        .setComponent(
                            new TextInput()
                                .setCustomId("playlist-saveFromURL-input")
                                .setPlaceholder(messages.commands.playlist.manage.save.modal.label.component)
                                .setStyle(TextInputStyle.Short)
                                .setRequired(true),
                        ),
                )
                .run(async (modal: ModalSubmitInteraction): Promise<void> => {
                    await modal.deferReply(MessageFlags.Ephemeral);

                    const url: string = modal.getInputValue("playlist-saveFromURL-input", true) as string;
                    if (!isUrl(url))
                        return modal.editOrReply({
                            content: "",
                            flags: MessageFlags.Ephemeral,
                            embeds: [
                                {
                                    description: messages.commands.playlist.manage.save.invalidUrl,
                                    color: EmbedColors.Red,
                                },
                            ],
                        });

                    const search: QueryResult | null = await client.manager.search({ query: url, requester: ctx.author });
                    if (!search?.tracks.length)
                        return modal.editOrReply({
                            content: "",
                            flags: MessageFlags.Ephemeral,
                            embeds: [
                                {
                                    description: messages.commands.playlist.manage.save.noResults,
                                    color: EmbedColors.Red,
                                },
                            ],
                        });

                    const track: TrackStructure | undefined = search.tracks
                        .filter((track): boolean => !playlist.tracks.some((t): boolean => t.encoded === track.encoded))
                        .at(0);
                    if (!track)
                        return modal.editOrReply({
                            content: "",
                            flags: MessageFlags.Ephemeral,
                            embeds: [
                                {
                                    description: messages.commands.playlist.manage.save.alreadyExists,
                                    color: EmbedColors.Red,
                                },
                            ],
                        });

                    playlist.tracks.push({
                        encoded: track.encoded!,
                        requesterId: track.requester.id,
                    });

                    await client.database.playlist.set(interaction.user.id, playlist);
                    await modal.editOrReply({
                        content: "",
                        flags: MessageFlags.Ephemeral,
                        embeds: [
                            {
                                description: messages.commands.playlist.manage.save.saved({
                                    type: messages.commands.playlist.manage.save.saveType[type],
                                    amount: 1,
                                }),
                            },
                        ],
                    });
                });

            await interaction.modal(modal);

            break;
        }
    }
}

/**
 *
 * Handles the track save button interaction for a playlist.
 * @param {ButtonInteraction} interaction The component button interaction.
 * @param {userPlaylist} playlist The user's playlist.
 * @return {Promise<void>}
 */
export async function playlistTrackSaveHandler(ctx: CommandContext, interaction: ButtonInteraction, playlist: userPlaylist): Promise<void> {
    const { messages } = await ctx.locale();

    const embed = new Embed().setColor(EmbedColors.White).setDescription(messages.commands.playlist.manage.save.description).setTimestamp();

    const row: ActionRow<Button> = new ActionRow<Button>().addComponents(
        new Button()
            .setCustomId("playlist-saveCurrentTrack")
            .setLabel(messages.commands.playlist.manage.save.options.current)
            .setStyle(ButtonStyle.Secondary),
        new Button()
            .setCustomId("playlist-saveCurrentQueue")
            .setLabel(messages.commands.playlist.manage.save.options.queue)
            .setStyle(ButtonStyle.Secondary),
        new Button()
            .setCustomId("playlist-saveFromURL")
            .setLabel(messages.commands.playlist.manage.save.options.url)
            .setStyle(ButtonStyle.Primary),
    );

    const message: WebhookMessageStructure = await interaction.write(
        {
            content: "",
            flags: MessageFlags.Ephemeral,
            embeds: [embed],
            components: [row],
        },
        true,
    );

    const collector: CreateComponentCollectorResult = message.createComponentCollector({
        idle: ms("1min"),
        filter: (i): boolean => i.user.id === ctx.author.id,
        async onPass(interaction): Promise<void> {
            await interaction.editOrReply({
                flags: MessageFlags.Ephemeral,
                embeds: [
                    {
                        description: messages.events.onlyUser({ userId: ctx.author.id }),
                        color: EmbedColors.Red,
                    },
                ],
            });
        },
    });

    collector.run(["playlist-saveCurrentTrack", "playlist-saveCurrentQueue", "playlist-saveFromURL"], async (interaction) => {
        if (!interaction.isButton()) return;

        const saveType: Record<string, SaveType> = {
            "playlist-saveCurrentTrack": SaveType.Current,
            "playlist-saveCurrentQueue": SaveType.Queue,
            "playlist-saveFromURL": SaveType.URL,
        } as const;

        const type: SaveType = saveType[interaction.customId];

        await playlistTrackSave(ctx, interaction, playlist, type);
    });
}
