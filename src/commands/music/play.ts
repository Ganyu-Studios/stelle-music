import {
    Command,
    Declare,
    Embed,
    type GuildCommandContext,
    LocalesT,
    type Message,
    Middlewares,
    Options,
    type User,
    type WebhookMessage,
    createStringOption,
} from "seyfert";
import { StelleOptions } from "#stelle/decorators";
import { StelleCategory } from "#stelle/types";

import { EmbedColors } from "seyfert/lib/common/index.js";
import { MessageFlags } from "seyfert/lib/types/index.js";

import { TimeFormat } from "#stelle/utils/Time.js";
import { omitKeys, sliceText } from "#stelle/utils/functions/utils.js";

import { onAutocompleteError } from "#stelle/utils/functions/overrides.js";

const options = {
    query: createStringOption({
        onAutocompleteError,
        description: "Enter the track name or url.",
        required: true,
        locales: {
            name: "locales.play.option.name",
            description: "locales.play.option.description",
        },
        autocomplete: async (interaction) => {
            const { client, member } = interaction;

            if (!interaction.guildId) return;

            const { searchEngine } = await client.database.getPlayer(interaction.guildId);
            const { messages } = client.t(await client.database.getLocale(interaction.guildId)).get();

            if (!client.manager.useable)
                return interaction.respond([{ name: messages.commands.play.autocomplete.noNodes, value: "noNodes" }]);

            const voice = await member?.voice().catch(() => null);
            if (!voice) return interaction.respond([{ name: messages.commands.play.autocomplete.noVoiceChannel, value: "noVoice" }]);

            const query = interaction.getInput();
            if (!query)
                return interaction.respond([
                    { name: messages.commands.play.autocomplete.noQuery, value: "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT" },
                ]);

            const { tracks } = await client.manager.search(query, searchEngine);
            if (!tracks.length) return interaction.respond([{ name: messages.commands.play.autocomplete.noTracks, value: "noTracks" }]);

            await interaction.respond(
                tracks.slice(0, 25).map((track) => {
                    const duration = track.info.isStream
                        ? messages.commands.play.live
                        : (TimeFormat.toDotted(track.info.duration) ?? messages.commands.play.undetermined);

                    return {
                        name: `${sliceText(track.info.title, 20)} (${duration}) - ${sliceText(track.info.author, 30)}`,
                        value: track.info.uri!,
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
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"],
})
@StelleOptions({ cooldown: 5, category: StelleCategory.Music })
@Options(options)
@LocalesT("locales.play.name", "locales.play.description")
@Middlewares(["checkNodes", "checkVoiceChannel", "checkVoicePermissions", "checkBotVoiceChannel"])
export default class PlayCommand extends Command {
    public override async run(ctx: GuildCommandContext<typeof options>): Promise<Message | WebhookMessage | void> {
        const { options, client, channelId, member } = ctx;
        const { query } = options;

        if (!member) return;

        const me = await ctx.me();
        if (!me) return;

        const state = await member.voice().catch(() => null);
        if (!state) return;

        const voice = await state.channel();
        if (!voice) return;

        const { messages } = await ctx.getLocale();
        const { defaultVolume, searchEngine } = await client.database.getPlayer(ctx.guildId);

        await ctx.deferReply();

        const player = client.manager.createPlayer({
            guildId: ctx.guildId,
            textChannelId: channelId,
            voiceChannelId: voice.id,
            volume: defaultVolume,
            selfDeaf: true,
        });

        if (!player.connected) await player.connect();

        const bot = await me.voice();
        if (bot && bot.channelId !== voice.id) return;

        const { loadType, playlist, tracks } = await player.search({ query, source: searchEngine }, ctx.author);

        player.set("localeString", await ctx.getLocaleString());
        player.set("me", omitKeys(client.me, ["client"]));

        if (voice.isStage() && bot.suppress) await bot.setSuppress(false);

        switch (loadType) {
            case "empty":
            case "error":
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

            case "track":
            case "search":
                {
                    const track = tracks[0];

                    if (player.get("enabledAutoplay")) await player.queue.add(track, 0);
                    else await player.queue.add(track);

                    const type = player.queue.tracks.length > 1 ? "results" : "result";
                    const status = track.info.isStream
                        ? messages.commands.play.live
                        : (TimeFormat.toDotted(track.info.duration) ?? messages.commands.play.undetermined);

                    const embed = new Embed()
                        .setThumbnail(track.info.artworkUrl ?? undefined)
                        .setColor(client.config.color.success)
                        .setDescription(
                            messages.commands.play.embed[type]({
                                duration: status,
                                position: player.queue.tracks.findIndex((t) => t.info.identifier === track.info.identifier) + 1,
                                requester: (track.requester as User).id,
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

            case "playlist":
                {
                    const track = tracks[0];

                    if (player.get("enabledAutoplay")) await player.queue.add(tracks, 0);
                    else await player.queue.add(tracks);

                    const embed = new Embed()
                        .setColor(client.config.color.success)
                        .setThumbnail(track.info.artworkUrl ?? undefined)
                        .setDescription(
                            messages.commands.play.embed.playlist({
                                query,
                                playlist: playlist?.name ?? playlist?.title ?? track.info.title,
                                requester: (track.requester as User).id,
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
        }
    }
}
