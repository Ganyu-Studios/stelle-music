import {
    ActionRow,
    Button,
    createStringOption,
    Declare,
    Embed,
    type GuildCommandContext,
    LocalesT,
    type Message,
    Middlewares,
    Options,
    SubCommand,
    type WebhookMessage,
} from "seyfert";
import { EmbedColors } from "seyfert/lib/common/index.js";
import type { CreateComponentCollectorResult } from "seyfert/lib/components/handler.js";
import { ButtonStyle, MessageFlags } from "seyfert/lib/types/index.js";
import { playlistAutocomplete } from "#stelle/utils/functions/autocompletes/playlist.js";
import { playlistTrackSaveHandler } from "#stelle/utils/functions/components/playlist.js";
import { ms } from "#stelle/utils/functions/time.js";
import { disableButtons } from "#stelle/utils/functions/utils.js";

const options = {
    id: createStringOption({
        description: "The id of the playlist to load.",
        required: true,
        autocomplete: playlistAutocomplete,
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
@Middlewares(["checkVoiceChannel", "checkBotVoiceChannel", "checkVoicePermissions", "checkNodes"])
export default class ManageSubcommand extends SubCommand {
    public async run(ctx: GuildCommandContext<typeof options>): Promise<WebhookMessage | Message | void> {
        const { client } = ctx;
        const { messages } = await ctx.locale();

        const { id } = ctx.options;

        const playlist = await client.database.playlist.get(id, ctx.author.id);
        if (!playlist)
            return ctx.editOrReply({
                content: "",
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
            const type = isPublic ? "public" : "private";
            return messages.commands.playlist.state[type];
        };

        const embed: Embed = new Embed()
            .setTitle(messages.commands.playlist.manage.title({ name: playlist.playlistName }))
            .setDescription(messages.commands.playlist.manage.description)
            .setColor(client.config.color.extra)
            .setTimestamp();

        const style: ButtonStyle = playlist.public ? ButtonStyle.Danger : ButtonStyle.Success;
        const label: string = messages.commands.playlist.manage.options.toggle({
            state: getVisibility(!playlist.public),
        });

        const row: ActionRow<Button> = new ActionRow<Button>().addComponents(
            new Button()
                .setCustomId("playlist-trackSave")
                .setLabel(messages.commands.playlist.manage.options.save)
                .setStyle(ButtonStyle.Primary),
            new Button()
                .setCustomId("playlist-trackDelete")
                .setLabel(messages.commands.playlist.manage.options.delete)
                .setStyle(ButtonStyle.Danger),
            new Button()
                .setCustomId("playlist-info")
                .setLabel(messages.commands.playlist.manage.options.info)
                .setStyle(ButtonStyle.Secondary),
            new Button().setCustomId("playlist-toggleVisibility").setLabel(label).setStyle(style),
        );

        const message: Message | WebhookMessage = await ctx.editOrReply(
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

        collector.run(["playlist-saveTrack", "playlist-deleteTrack", "playlist-info", "playlist-changeStatus"], async (interaction) => {
            if (!interaction.isButton()) return;

            await interaction.update({ components: disableButtons(message.components) });

            switch (interaction.customId) {
                case "playlist-trackSave":
                    await playlistTrackSaveHandler(ctx, interaction, playlist);
                    break;

                case "playlist-trackDelete":
                    break;

                case "playlist-info":
                    break;

                case "playlist-toggleVisibility":
                    break;
            }
        });
    }
}
