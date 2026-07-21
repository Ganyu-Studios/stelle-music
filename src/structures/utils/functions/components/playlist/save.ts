import { LoadType, type PlayerStructure, type QueryResult, type TrackStructure } from "hoshimi";
import {
    type ButtonInteraction,
    type CommandContext,
    Label,
    type MessageStructure,
    Modal,
    type ModalSubmitInteraction,
    TextInput,
    type WebhookMessageStructure,
} from "seyfert";
import { EmbedColors } from "seyfert/lib/common/index.js";
import { MessageFlags, TextInputStyle } from "seyfert/lib/types/index.js";
import type { userPlaylist } from "#stelle/prisma";
import { UtilsOps } from "#stelle/utils/functions/internal/utils.js";

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
export async function playlistTrackSave(
    ctx: CommandContext,
    interaction: ButtonInteraction,
    playlist: userPlaylist,
    type: SaveType,
): Promise<MessageStructure | WebhookMessageStructure | void> {
    const { messages } = await ctx.locale();
    const { client } = ctx;

    if (!ctx.inGuild()) return;

    const player: PlayerStructure | undefined = ctx.getPlayer();
    if (!player?.playing && [SaveType.Queue, SaveType.Current].includes(type))
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
                    requester: t.requester,
                }));

            playlist.tracks.push(...tracks);

            await client.database.playlist.set(interaction.user.id, playlist);
            await interaction.editOrReply({
                content: "",
                embeds: [
                    {
                        color: client.config.color.success,
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
                requester: track.requester,
            });

            await client.database.playlist.set(interaction.user.id, playlist);
            await interaction.editOrReply({
                content: "",
                flags: MessageFlags.Ephemeral,
                embeds: [
                    {
                        color: client.config.color.success,
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
                    if (!UtilsOps.isUrl(url))
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

                    let amount = 0;

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

                    if (search.loadType === LoadType.Track || search.loadType === LoadType.Search) {
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

                        amount += 1;

                        playlist.tracks.push({
                            encoded: track.encoded!,
                            requester: track.requester,
                        });
                    } else if (search.loadType === LoadType.Playlist) {
                        const tracks = search.tracks
                            .filter((track) => !playlist.tracks.some((t) => t.encoded === track.encoded))
                            .map((t) => ({
                                encoded: t.encoded!,
                                requester: t.requester,
                            }));

                        if (!tracks.length)
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

                        amount += tracks.length;

                        playlist.tracks.push(...tracks);
                    }

                    await client.database.playlist.set(interaction.user.id, playlist);
                    await modal.editOrReply({
                        content: "",
                        flags: MessageFlags.Ephemeral,
                        embeds: [
                            {
                                color: client.config.color.success,
                                description: messages.commands.playlist.manage.save.saved({
                                    amount,
                                    type: messages.commands.playlist.manage.save.saveType[type],
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
