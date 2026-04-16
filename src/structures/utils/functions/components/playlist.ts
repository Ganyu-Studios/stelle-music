import type { NodeStructure, TrackStructure } from "hoshimi";
import {
    ActionRow,
    type AllGuildVoiceChannels,
    Button,
    type ButtonInteraction,
    type CommandContext,
    Embed,
    type Guild,
    type GuildMember,
    Label,
    Modal,
    type ModalSubmitInteraction,
    TextInput,
    type VoiceState,
    type WebhookMessageStructure,
} from "seyfert";
import { EmbedColors, type PermissionStrings } from "seyfert/lib/common/index.js";
import type { CreateComponentCollectorResult } from "seyfert/lib/components/handler.js";
import type { PermissionsBitField } from "seyfert/lib/structures/extra/Permissions.js";
import { ButtonStyle, MessageFlags, TextInputStyle } from "seyfert/lib/types/index.js";
import type { userPlaylist } from "#stelle/prisma";
import type { PermissionNames } from "#stelle/types";
import { ManageButtonIdentifiers, SaveButtonCustomIds, SaveButtonIdentifiers, type TrackUser } from "#stelle/types";
import { joinVoiceChannel } from "#stelle/utils/functions/manager/voice.js";
import { ms } from "#stelle/utils/functions/time.js";
import { getPermissionKeys, requesterFn, updateComponents } from "#stelle/utils/functions/utils.js";
import { EmbedPaginator } from "#stelle/utils/paginator.js";
import { playlistTrackSave, SaveType } from "./playlist/save.js";
import { parseTrackSelection } from "./playlist/selection.js";

export { SaveType } from "./playlist/save.js";

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
            .setCustomId(SaveButtonIdentifiers.CurrentTrack)
            .setLabel(messages.commands.playlist.manage.save.options.current)
            .setStyle(ButtonStyle.Secondary),
        new Button()
            .setCustomId(SaveButtonIdentifiers.CurrentQueue)
            .setLabel(messages.commands.playlist.manage.save.options.queue)
            .setStyle(ButtonStyle.Secondary),
        new Button()
            .setCustomId(SaveButtonIdentifiers.FromURL)
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

    collector.run(SaveButtonCustomIds, async (interaction): Promise<void> => {
        if (!interaction.isButton()) return;

        const saveType: Record<SaveButtonIdentifiers, SaveType> = {
            [SaveButtonIdentifiers.CurrentTrack]: SaveType.Current,
            [SaveButtonIdentifiers.CurrentQueue]: SaveType.Queue,
            [SaveButtonIdentifiers.FromURL]: SaveType.URL,
        } as const;

        const type: SaveType = saveType[interaction.customId as SaveButtonIdentifiers];

        await playlistTrackSave(ctx, interaction, playlist, type);
    });
}

/**
 *
 * Handles the track visibility toggle button interaction for a playlist.
 * @param {CommandContext} ctx The command context.
 * @param {ButtonInteraction} interaction The component button interaction.
 * @param {userPlaylist} playlist The user's playlist.
 * @return {Promise<void>}
 */
export async function playlistVisibilityToggleHandler(
    ctx: CommandContext,
    interaction: ButtonInteraction,
    playlist: userPlaylist,
): Promise<void> {
    const { messages } = await ctx.locale();

    playlist.public = !playlist.public;

    /**
     *
     * Get the visibility of the playlist.
     * @param {boolean} isPublic True if the playlist is public, false otherwise.
     * @returns {string} The visibility of the playlist.
     */
    const getVisibility = (isPublic: boolean): string => {
        const type = isPublic ? "public" : "private";
        return messages.commands.playlist.state[type];
    };

    const style: ButtonStyle = playlist.public ? ButtonStyle.Danger : ButtonStyle.Success;
    const label: string = messages.commands.playlist.manage.options.toggle({
        state: getVisibility(!playlist.public),
    });

    await ctx.client.database.playlist.set(interaction.user.id, playlist);
    await interaction.update({
        components: updateComponents(interaction.message, {
            style,
            label,
            customId: ManageButtonIdentifiers.ToggleVisibility,
        }),
    });
}

/**
 * Handles the playlist load button interaction.
 * @param {CommandContext} ctx The command context.
 * @param {ButtonInteraction} interaction The component button interaction.
 * @param {userPlaylist} playlist The user's playlist.
 * @returns {Promise<void>}
 */
export async function playlistLoadHandler(ctx: CommandContext, interaction: ButtonInteraction, playlist: userPlaylist): Promise<void> {
    if (!ctx.inGuild()) return;

    const { messages } = await ctx.locale();

    if (!ctx.client.manager.isUseable())
        return interaction.editOrReply({
            content: "",
            flags: MessageFlags.Ephemeral,
            embeds: [
                {
                    description: messages.events.noNodes,
                    color: EmbedColors.Red,
                },
            ],
        });

    if (!playlist.tracks.length)
        return interaction.editOrReply({
            content: "",
            flags: MessageFlags.Ephemeral,
            embeds: [
                {
                    description: messages.commands.playlist.noTracks,
                    color: EmbedColors.Red,
                },
            ],
        });

    const me: GuildMember | null = await ctx.me().catch((): null => null);
    if (!me) return;

    const state: VoiceState | null = await ctx.member.voice().catch((): null => null);
    if (!state)
        return interaction.editOrReply({
            content: "",
            flags: MessageFlags.Ephemeral,
            embeds: [
                {
                    description: messages.events.noVoiceChannel,
                    color: EmbedColors.Red,
                },
            ],
        });

    const voice: AllGuildVoiceChannels | null | undefined = await state.channel().catch((): null => null);
    if (!voice)
        return interaction.editOrReply({
            content: "",
            flags: MessageFlags.Ephemeral,
            embeds: [
                {
                    description: messages.events.noVoiceChannel,
                    color: EmbedColors.Red,
                },
            ],
        });

    const bot: VoiceState | null = await me.voice().catch((): null => null);
    if (bot && bot.channelId !== state.channelId)
        return interaction.editOrReply({
            flags: MessageFlags.Ephemeral,
            embeds: [
                {
                    description: messages.events.noSameVoice({ channelId: bot.channelId! }),
                    color: EmbedColors.Red,
                },
            ],
        });

    const { stagePermissions, voicePermissions } = ctx.client.config.permissions;
    const permissions: PermissionsBitField = await ctx.client.channels.memberPermissions(voice.id, me);
    const missings: PermissionStrings = permissions.keys(permissions.missings(voice.isStage() ? stagePermissions : voicePermissions));

    if (missings.length) {
        const keys: PermissionNames[] = getPermissionKeys(missings);

        return interaction.editOrReply({
            content: "",
            flags: MessageFlags.Ephemeral,
            embeds: [
                {
                    description: messages.events.permissions.embed.channel({
                        channelId: voice.id,
                    }),
                    color: EmbedColors.Red,
                    fields: [
                        {
                            name: messages.events.permissions.embed.field,
                            value: keys.map((p): string => `- ${messages.events.permissions.list[p]}`).join("\n"),
                        },
                    ],
                },
            ],
        });
    }

    await interaction.deferReply(MessageFlags.Ephemeral);

    const { defaultVolume } = await ctx.client.database.players.get(ctx.guildId);

    const player = ctx.client.manager.createPlayer({
        guildId: ctx.guildId,
        textId: ctx.channelId,
        voiceId: voice.id,
        volume: defaultVolume,
        selfMute: false,
        selfDeaf: true,
    });

    await joinVoiceChannel(player, voice, me);

    if (!(await player.data.get("localeString"))) await player.data.set("localeString", await ctx.localeString());
    if (!(await player.data.get("me"))) await player.data.set("me", requesterFn(ctx.client.me));

    const tracks: TrackStructure[] = await player.node.decode
        .multiple(
            playlist.tracks.map((t): string => t.encoded),
            {} as TrackUser,
        )
        .then((decoded: TrackStructure[]): TrackStructure[] =>
            decoded.map((track, i): TrackStructure => {
                track.requester = requesterFn(playlist.tracks[i].requester);
                return track;
            }),
        );

    await player.queue.add(tracks);

    if (!player.playing && !player.paused) await player.play();

    await interaction.editOrReply({
        content: "",
        flags: MessageFlags.Ephemeral,
        embeds: [
            {
                description: messages.commands.playlist.loaded({ name: playlist.playlistName }),
                color: ctx.client.config.color.success,
            },
        ],
    });
}

/**
 * Handles the track delete button interaction for a playlist.
 * @param {CommandContext} ctx The command context.
 * @param {ButtonInteraction} interaction The component button interaction.
 * @param {userPlaylist} playlist The user's playlist.
 * @returns {Promise<void>}
 */
export async function playlistTrackDeleteHandler(
    ctx: CommandContext,
    interaction: ButtonInteraction,
    playlist: userPlaylist,
): Promise<void> {
    const { messages } = await ctx.locale();

    if (!playlist.tracks.length)
        return interaction.editOrReply({
            content: "",
            flags: MessageFlags.Ephemeral,
            embeds: [
                {
                    description: messages.commands.playlist.noTracks,
                    color: EmbedColors.Red,
                },
            ],
        });

    const modal: Modal = new Modal()
        .setTitle(messages.commands.playlist.manage.delete.modal.title)
        .setCustomId("playlist-deleteTracks-modal")
        .addComponents(
            new Label()
                .setLabel(messages.commands.playlist.manage.delete.modal.label.label)
                .setDescription(messages.commands.playlist.manage.delete.modal.label.description)
                .setComponent(
                    new TextInput()
                        .setCustomId("playlist-deleteTracks-input")
                        .setPlaceholder(messages.commands.playlist.manage.delete.modal.label.component)
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true),
                ),
        )
        .run(async (modal: ModalSubmitInteraction): Promise<void> => {
            await modal.deferReply(MessageFlags.Ephemeral);

            const value: string = modal.getInputValue("playlist-deleteTracks-input", true) as string;

            let selection: number[];

            try {
                selection = parseTrackSelection(value, playlist.tracks.length);
            } catch (error) {
                const description: string =
                    error instanceof RangeError
                        ? messages.commands.playlist.manage.delete.outOfRange({ tracks: playlist.tracks.length })
                        : messages.commands.playlist.manage.delete.invalidSelection;

                return modal.editOrReply({
                    content: "",
                    flags: MessageFlags.Ephemeral,
                    embeds: [
                        {
                            description,
                            color: EmbedColors.Red,
                        },
                    ],
                });
            }

            let amount: number = 0;

            for (const index of selection.slice().reverse()) {
                const [track] = playlist.tracks.splice(index - 1, 1);
                if (track) amount += 1;
            }

            await ctx.client.database.playlist.set(ctx.author.id, playlist);

            await modal.editOrReply({
                content: "",
                flags: MessageFlags.Ephemeral,
                embeds: [
                    {
                        description: messages.commands.playlist.manage.delete.deleted({ amount }),
                        color: ctx.client.config.color.success,
                    },
                ],
            });
        });

    await interaction.modal(modal);
}

/**
 *
 * Handles the playlist information button interaction.
 * @param {CommandContext} ctx The command context.
 * @param {ButtonInteraction} interaction The component button interaction.
 * @param {userPlaylist} playlist The user's playlist.
 * @returns {Promise<void>}
 */
export async function playlistInfoHandler(ctx: CommandContext, interaction: ButtonInteraction, playlist: userPlaylist): Promise<void> {
    if (!ctx.inGuild()) return;

    const { messages } = await ctx.locale();

    const limit: number = 20;

    const guild: Guild<"cached" | "api"> = await ctx.guild();
    const node: NodeStructure = ctx.client.manager.nodeManager.getLeastUsed();
    const tracks: string[] = await node.decode
        .multiple(
            playlist.tracks.map((t): string => t.encoded),
            {} as TrackUser,
        )
        .then((decoded: TrackStructure[]): string[] =>
            decoded.map((track, i): string => {
                const requester: TrackUser = requesterFn(playlist.tracks[i].requester);

                return `#${i + 1}. [\`${track.info.title}\`](${track.info.uri}) - ${requester.tag}`;
            }),
        );

    if (!(await interaction.replied) && !interaction.deferred) await interaction.deferUpdate();

    if (tracks.length <= limit) {
        await interaction.followup({
            content: "",
            flags: MessageFlags.Ephemeral,
            embeds: [
                new Embed()
                    .setDescription(messages.events.playerQueue({ tracks: tracks.slice(0, limit).join("\n") }))
                    .setColor(ctx.client.config.color.extra)
                    .setThumbnail(guild.iconURL())
                    .setTimestamp()
                    .setAuthor({ name: ctx.author.tag, iconUrl: ctx.author.avatarURL() }),
            ],
        });
    } else {
        const paginator: EmbedPaginator = new EmbedPaginator({ ctx });

        for (let i: number = 0; i < tracks.length; i += limit) {
            paginator.addEmbed(
                new Embed()
                    .setDescription(messages.events.playerQueue({ tracks: tracks.slice(i, i + limit).join("\n") }))
                    .setColor(ctx.client.config.color.extra)
                    .setThumbnail(guild.iconURL())
                    .setTimestamp()
                    .setAuthor({ name: ctx.author.tag, iconUrl: ctx.author.avatarURL() }),
            );
        }

        await paginator.reply({ ephemeral: true, followup: true });
    }
}
