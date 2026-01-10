import {
    ActionRow,
    Button,
    type ButtonInteraction,
    type CommandContext,
    Embed,
    Label,
    type Message,
    Modal,
    TextInput,
    type WebhookMessage,
} from "seyfert";
import { EmbedColors } from "seyfert/lib/common/index.js";
import type { CreateComponentCollectorResult } from "seyfert/lib/components/handler.js";
import { type APIUser, ButtonStyle, MessageFlags, TextInputStyle } from "seyfert/lib/types/index.js";
import type { userPlaylist } from "#stelle/prisma";
import { ms } from "../time.js";
import { disableButtons } from "../utils.js";

/**
 * Saves tracks to the user's playlist.
 * @param {CommandContext} ctx The command context.
 * @param {ButtonInteraction} interaction The component button interaction.
 * @param {userPlaylist} playlist The user's playlist.
 * @param {"queue" | "current" | "url"} type The type of save operation.
 * @returns {Promise<Message | WebhookMessage | void>} The response message.
 */
async function playlistTrackSave(
    ctx: CommandContext,
    interaction: ButtonInteraction,
    playlist: userPlaylist,
    type: "queue" | "current" | "url",
): Promise<Message | WebhookMessage | void> {
    const { messages } = await ctx.locale();
    const { client } = ctx;

    if (!ctx.inGuild()) return;

    const player = client.manager.getPlayer(ctx.guildId);
    if (!player || !player.playing) return;

    switch (type) {
        case "queue": {
            const tracks = player.queue.tracks
                .filter((track) => !playlist.tracks.some((t) => t.encoded === track.encoded))
                .map((t) => ({
                    encoded: t.encoded!,
                    requesterId: (t.requester as APIUser).id,
                }));

            playlist.tracks.push(...tracks);

            await client.database.playlist.set(interaction.user.id, playlist);
            await interaction.editOrReply({
                content: "",
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

        case "current": {
            const track = player.queue.current;
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
                requesterId: (track.requester as APIUser).id,
            });

            await client.database.playlist.set(interaction.user.id, playlist);
            await interaction.editOrReply({
                content: "",
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

        case "url": {
            const modal = new Modal()
                .setTitle(messages.commands.playlist.manage.save.modal.title)
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
                .run(async (modal) => {
                    const url = modal.getInputValue("playlist-saveFromURL-input", true) as string;

                    await modal.deferReply(MessageFlags.Ephemeral);

                    const res = await client.manager.search({ query: url, requester: ctx.author });
                    if (!res || !res.tracks.length) return;

                    const track = res.tracks.filter((track) => !playlist.tracks.some((t) => t.encoded === track.encoded)).at(0);
                    if (!track) return;

                    playlist.tracks.push({
                        encoded: track.encoded!,
                        requesterId: (track.requester as APIUser).id,
                    });

                    await client.database.playlist.set(interaction.user.id, playlist);
                    await modal.editOrReply({
                        content: "",
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

    const row = new ActionRow<Button>().addComponents(
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

    const message: WebhookMessage = await interaction.editOrReply(
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
        async onStop(reason): Promise<void> {
            if (reason === "idle") await message.edit({ components: disableButtons(message.components) });
        },
        async onPass(interaction): Promise<void> {
            await interaction.editOrReply({
                flags: MessageFlags.Ephemeral,
                embeds: [
                    {
                        description: messages.events.noCollector({ userId: ctx.author.id }),
                        color: EmbedColors.Red,
                    },
                ],
            });
        },
    });

    collector.run(["playlist-saveCurrentTrack", "playlist-saveCurrentQueue", "playlist-saveFromURL"], async (interaction) => {
        if (!interaction.isButton()) return;

        switch (interaction.customId) {
            case "playlist-saveCurrentTrack":
                await playlistTrackSave(ctx, interaction, playlist, "current");
                break;
            case "playlist-saveCurrentQueue":
                await playlistTrackSave(ctx, interaction, playlist, "queue");
                break;
            case "playlist-saveFromURL":
                await playlistTrackSave(ctx, interaction, playlist, "url");
                break;
        }
    });
}
