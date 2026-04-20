import {
    ActionRow,
    Button,
    Container,
    createStringOption,
    Declare,
    type GuildCommandContext,
    LocalesT,
    type MessageStructure,
    Options,
    Section,
    SubCommand,
    TextDisplay,
    type WebhookMessageStructure,
} from "seyfert";
import { EmbedColors } from "seyfert/lib/common/index.js";
import type { CreateComponentCollectorResult } from "seyfert/lib/components/handler.js";
import { ButtonStyle, MessageFlags } from "seyfert/lib/types/index.js";
import { ManageButtonCustomIds, ManageButtonIdentifiers } from "#stelle/types";
import { playlistAutocomplete as autocomplete } from "#stelle/utils/functions/autocompletes/playlist.js";
import {
    playlistInfoHandler,
    playlistLoadHandler,
    playlistTrackDeleteHandler,
    playlistTrackSaveHandler,
    playlistVisibilityToggleHandler,
} from "#stelle/utils/functions/components/playlist.js";
import { ms } from "#stelle/utils/functions/time.js";
import { hasFlags, updateComponents } from "#stelle/utils/functions/utils.js";

const options = {
    id: createStringOption({
        description: "The id of the playlist to load.",
        required: true,
        autocomplete,
        locales: {
            name: "locales.playlist.commands.load.option.name",
            description: "locales.playlist.commands.load.option.description",
        },
    }),
};

@Declare({
    name: "manage",
    description: "Manage a music playlist.",
})
@LocalesT("locales.playlist.commands.manage.name", "locales.playlist.commands.manage.description")
@Options(options)
export default class ManageSubcommand extends SubCommand {
    public async run(ctx: GuildCommandContext<typeof options>): Promise<WebhookMessageStructure | MessageStructure | void> {
        const { client } = ctx;
        const { messages } = await ctx.locale();

        const { id } = ctx.options;

        const playlist = await client.database.playlist.get(id, ctx.author.id);
        if (!playlist)
            return ctx.editOrReply({
                content: "",
                flags: MessageFlags.Ephemeral,
                embeds: [
                    {
                        description: messages.commands.playlist.noPlaylist,
                        color: EmbedColors.Red,
                    },
                ],
            });

        /**
         *
         * Get the visibility of the playlist.
         * @param {boolean} isPublic True if the playlist is public, false otherwise.
         * @returns {string} The visibility of the playlist.
         */
        const getVisibility = (isPublic: boolean): string => {
            const type: "public" | "private" = isPublic ? "public" : "private";
            return messages.commands.playlist.state[type];
        };

        const container: Container = new Container()
            .setColor(client.config.color.extra)
            .addComponents(
                new TextDisplay().setContent(
                    `${messages.commands.playlist.manage.title({ name: playlist.playlistName })}\n\n${messages.commands.playlist.manage.description}`,
                ),
            );

        const style: ButtonStyle = playlist.public ? ButtonStyle.Danger : ButtonStyle.Success;
        const label: string = messages.commands.playlist.manage.options.toggle({
            state: getVisibility(!playlist.public),
        });

        const loadSection: Section<Button> = new Section<Button>()
            .addComponents(
                new TextDisplay().setContent(
                    `${messages.commands.playlist.manage.loadSection.title}\n-# ${messages.commands.playlist.manage.loadSection.description}`,
                ),
            )
            .setAccessory(
                new Button()
                    .setCustomId(ManageButtonIdentifiers.Load)
                    .setLabel(messages.commands.playlist.manage.options.load)
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(!playlist.tracks.length),
            );

        const row: ActionRow<Button> = new ActionRow<Button>().addComponents(
            new Button()
                .setCustomId(ManageButtonIdentifiers.TrackSave)
                .setLabel(messages.commands.playlist.manage.options.save)
                .setStyle(ButtonStyle.Primary),
            new Button()
                .setCustomId(ManageButtonIdentifiers.TrackDelete)
                .setLabel(messages.commands.playlist.manage.options.delete)
                .setStyle(ButtonStyle.Danger)
                .setDisabled(!playlist.tracks.length),
            new Button()
                .setCustomId(ManageButtonIdentifiers.Info)
                .setLabel(messages.commands.playlist.manage.options.info)
                .setStyle(ButtonStyle.Secondary),
            new Button().setCustomId(ManageButtonIdentifiers.ToggleVisibility).setLabel(label).setStyle(style),
        );

        container.addComponents(loadSection);
        container.addComponents(row);

        const message: MessageStructure | WebhookMessageStructure = await ctx.editOrReply(
            {
                content: "",
                flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                components: [container],
            },
            true,
        );

        const collector: CreateComponentCollectorResult = message.createComponentCollector({
            idle: ms("1min"),
            filter: (i): boolean => i.user.id === ctx.author.id,
            onPass: async (interaction): Promise<void> => {
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
            onStop: async (reason): Promise<void> => {
                if (reason === "idle" && !hasFlags(message.flags, [MessageFlags.Ephemeral])) {
                    await message.edit({ components: updateComponents(message, { disabled: true }) });
                }
            },
        });

        collector.run(ManageButtonCustomIds, async (interaction): Promise<void> => {
            if (!interaction.isButton()) return;

            const playlistHandlers = {
                [ManageButtonIdentifiers.TrackSave]: playlistTrackSaveHandler,
                [ManageButtonIdentifiers.TrackDelete]: playlistTrackDeleteHandler,
                [ManageButtonIdentifiers.Info]: playlistInfoHandler,
                [ManageButtonIdentifiers.Load]: playlistLoadHandler,
                [ManageButtonIdentifiers.ToggleVisibility]: playlistVisibilityToggleHandler,
            };

            await playlistHandlers[interaction.customId as ManageButtonIdentifiers](ctx, interaction, playlist);
        });
    }
}
