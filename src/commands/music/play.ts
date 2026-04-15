import { LoadType, type QueryResult, type TrackStructure } from "hoshimi";
import {
    type AllGuildVoiceChannels,
    Command,
    createStringOption,
    Declare,
    type DefaultLocale,
    Embed,
    type GuildCommandContext,
    type GuildMember,
    LocalesT,
    type MessageStructure,
    Middlewares,
    Options,
    type VoiceState,
    type WebhookMessageStructure,
} from "seyfert";
import { EmbedColors } from "seyfert/lib/common/index.js";
import { ApplicationIntegrationType, InteractionContextType, MessageFlags } from "seyfert/lib/types/index.js";
import { StelleCategory } from "#stelle/types";
import { StelleOptions } from "#stelle/utils/decorator.js";
import { onAutocompleteError } from "#stelle/utils/functions/internal/overrides.js";
import { joinVoiceChannel } from "#stelle/utils/functions/manager/voice.js";
import { formatDuration, requesterFn, truncate } from "#stelle/utils/functions/utils.js";

const options = {
    query: createStringOption({
        onAutocompleteError,
        description: "Enter the track name or url.",
        required: true,
        locales: {
            name: "locales.play.option.name",
            description: "locales.play.option.description",
        },
        autocomplete: async (interaction): Promise<void> => {
            const { client, member, guildId } = interaction;

            const localeString: string = interaction.user.locale ?? client.config.defaultLocale;
            const t: DefaultLocale = client.t(localeString).get();

            if (!(guildId && member)) return interaction.respond([{ name: t.messages.events.autocomplete.noGuild, value: "noGuild" }]);

            const { searchPlatform } = await client.database.players.get(guildId);
            const { messages } = client.t(await client.database.locales.get(guildId)).get();

            if (!client.manager.isUseable()) return interaction.respond([{ name: messages.events.autocomplete.noNodes, value: "noNodes" }]);

            const voice: VoiceState | null = await member.voice().catch((): null => null);
            if (!voice) return interaction.respond([{ name: messages.events.autocomplete.noVoiceChannel, value: "noVoice" }]);

            const query: string = interaction.getInput();
            if (!query)
                return interaction.respond([
                    { name: messages.events.autocomplete.noQuery, value: "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT" },
                ]);

            const { tracks }: QueryResult = await client.manager.search({ query, source: searchPlatform });

            if (!tracks.length) return interaction.respond([{ name: messages.events.autocomplete.noTracks, value: "noTracks" }]);

            await interaction.respond(
                tracks.slice(0, 25).map((track) => {
                    const duration: string = formatDuration(track, messages);

                    return {
                        name: `${truncate(track.info.title, 45)} (${duration}) - ${truncate(track.info.author, 30)}`,
                        value: track.info.uri,
                    };
                }),
            );
        },
    }),
};

@Declare({
    name: "play",
    description: "Play music with Stelle.",
    aliases: ["p"],
    integrationTypes: [ApplicationIntegrationType.GuildInstall],
    contexts: [InteractionContextType.Guild],
})
@StelleOptions({ cooldown: 5, category: StelleCategory.Music })
@Options(options)
@LocalesT("locales.play.name", "locales.play.description")
@Middlewares(["checkNodes", "checkVoiceChannel", "checkVoicePermissions", "checkBotVoiceChannel"])
export default class PlayCommand extends Command {
    public override async run(ctx: GuildCommandContext<typeof options>): Promise<MessageStructure | WebhookMessageStructure | void> {
        const { options, client, channelId, member } = ctx;
        const { query } = options;

        if (!member) return;

        const me: GuildMember | null = await ctx.me().catch((): null => null);
        if (!me) return;

        const state: VoiceState | null = await member.voice().catch((): null => null);
        if (!state) return;

        const voice: AllGuildVoiceChannels | undefined = await state.channel();
        if (!voice) return;

        await ctx.deferReply();

        const { messages } = await ctx.locale();
        const { defaultVolume, searchPlatform } = await client.database.players.get(ctx.guildId);

        const player = client.manager.createPlayer({
            guildId: ctx.guildId,
            textId: channelId,
            voiceId: voice.id,
            volume: defaultVolume,
            selfDeaf: true,
        });

        await joinVoiceChannel(player, voice, me);

        const { loadType, playlist, tracks } = await player.search({ query, source: searchPlatform, requester: ctx.author });

        if (!(await player.data.get("localeString"))) await player.data.set("localeString", await ctx.localeString());
        if (!(await player.data.get("me"))) await player.data.set("me", requesterFn(client.me));

        const autoplayIndex = (await player.data.get("enabledAutoplay")) ? 0 : undefined;

        switch (loadType) {
            case LoadType.Empty:
            case LoadType.Error:
                {
                    if (!player.queue.current) await player.destroy();

                    await ctx.editOrReply({
                        flags: MessageFlags.Ephemeral,
                        content: "",
                        embeds: [
                            {
                                color: EmbedColors.Red,
                                description: messages.commands.play.noResults,
                            },
                        ],
                    });
                }
                break;

            case LoadType.Track:
            case LoadType.Search:
                {
                    const track: TrackStructure | undefined = tracks.at(0);
                    if (!track)
                        return ctx.editOrReply({
                            flags: MessageFlags.Ephemeral,
                            content: "",
                            embeds: [
                                {
                                    color: EmbedColors.Red,
                                    description: messages.commands.play.noResults,
                                },
                            ],
                        });

                    await player.queue.add(track, autoplayIndex);

                    const duration: string = formatDuration(track, messages);

                    const embed = new Embed()
                        .setThumbnail(track.info.artworkUrl ?? undefined)
                        .setColor(client.config.color.success)
                        .setDescription(
                            messages.commands.play.embed.result({
                                duration,
                                requester: track.requester.id,
                                position: player.queue.tracks.findIndex((t) => t.info.identifier === track.info.identifier) + 1,
                                title: track.info.title,
                                url: track.info.uri!,
                                volume: player.volume,
                            }),
                        )
                        .setTimestamp();

                    await ctx.editOrReply({
                        content: "",
                        embeds: [embed],
                    });

                    if (!player.playing) await player.play();
                }
                break;

            case LoadType.Playlist:
                {
                    const track: TrackStructure | undefined = tracks.at(0);
                    if (!track)
                        return ctx.editOrReply({
                            flags: MessageFlags.Ephemeral,
                            content: "",
                            embeds: [
                                {
                                    color: EmbedColors.Red,
                                    description: messages.commands.play.noResults,
                                },
                            ],
                        });

                    await player.queue.add(tracks, autoplayIndex);

                    const embed = new Embed()
                        .setColor(client.config.color.success)
                        .setThumbnail(track.info.artworkUrl ?? undefined)
                        .setDescription(
                            messages.commands.play.embed.playlist({
                                query,
                                playlist: playlist?.info.name ?? track.info.title,
                                requester: track.requester.id,
                                tracks: tracks.length,
                                volume: player.volume,
                            }),
                        )
                        .setTimestamp();

                    await ctx.editOrReply({
                        content: "",
                        embeds: [embed],
                    });

                    if (!player.playing) await player.play();
                }
                break;

            default:
                {
                    if (!player.queue.current) await player.destroy();

                    await ctx.editOrReply({
                        flags: MessageFlags.Ephemeral,
                        content: "",
                        embeds: [
                            {
                                color: EmbedColors.Red,
                                description: messages.commands.play.noResults,
                            },
                        ],
                    });
                }
                break;
        }
    }
}
