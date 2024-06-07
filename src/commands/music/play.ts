import {
    Command,
    type CommandContext,
    Declare,
    Embed,
    LocalesT,
    type Message,
    Options,
    type User,
    type WebhookMessage,
    createStringOption,
} from "seyfert";
import { StelleOptions } from "#stelle/decorators";

import { MessageFlags } from "discord-api-types/v10";
import { EmbedColors } from "seyfert/lib/common/index.js";

import { parseTime, sliceText } from "#stelle/utils/functions/utils.js";

const options = {
    query: createStringOption({
        description: "Enter the track name or url.",
        required: true,
        locales: {
            name: "locales.play.option.name",
            description: "locales.play.option.description",
        },
        autocomplete: async (interaction) => {
            const { client, member, guildId } = interaction;

            if (!guildId) return;

            const locale = await client.database.getLocale(guildId);

            const { messages } = client.t(locale).get(locale);

            if (!client.manager.isUseable)
                return interaction.respond([{ name: messages.commands.play.autocomplete.noNodes, value: "noNodes" }]);

            const voice = member?.voice();
            if (!voice) return interaction.respond([{ name: messages.commands.play.autocomplete.noVoiceChannel, value: "noVoice" }]);

            const query = interaction.getInput();
            if (!query)
                return interaction.respond([
                    { name: messages.commands.play.autocomplete.noQuery, value: "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT" },
                ]);

            const res = await client.manager.search(query, { requester: null, engine: "spotify" });
            const tracks = res.tracks.slice(0, 25).map((track) => {
                const duration = track.isStream
                    ? messages.commands.play.live
                    : parseTime(track.length) ?? messages.commands.play.undetermined;

                return {
                    name: `${sliceText(track.title)} (${duration}) - ${sliceText(track.author ?? "---", 30)}`,
                    value: track.uri!,
                };
            });

            if (!tracks.length) return interaction.respond([{ name: messages.commands.play.autocomplete.noTracks, value: "noTracks" }]);

            await interaction.respond(tracks);
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
@StelleOptions({ cooldown: 5, inVoice: true, sameVoice: true, checkNodes: true })
@Options(options)
@LocalesT("locales.play.name", "locales.play.description")
export default class PlayCommand extends Command {
    async run(ctx: CommandContext<typeof options>): Promise<Message | WebhookMessage | void> {
        const { options, client, guildId, channelId, member, author } = ctx;
        const { query } = options;

        if (!(guildId && member)) return;

        const voice = member.voice();
        if (!voice) return;

        const botVoice = ctx.me()?.voice();
        if (botVoice && botVoice.channelId !== voice.channelId) return;

        const { messages } = ctx.t.get(await ctx.getLocale());

        await ctx.deferReply();

        const player = await client.manager.createPlayer({
            guildId: guildId,
            textId: channelId,
            voiceId: voice.channelId,
            volume: 100,
        });

        const result = await player.search(query, { requester: author, engine: "spotify" });
        if (!result.tracks.length)
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

        player.data.set("commandContext", ctx);

        switch (result.type) {
            case "TRACK":
            case "SEARCH":
                {
                    const track = result.tracks[0];

                    player.queue.add(track);

                    const type = player.queue.totalSize > 1 ? "results" : "result";
                    const status = track.isStream
                        ? messages.commands.play.live
                        : parseTime(track.length) ?? messages.commands.play.undetermined;

                    const embed = new Embed()
                        .setThumbnail(track.thumbnail)
                        .setColor(client.config.color.success)
                        .setDescription(
                            messages.commands.play.embed[type]({
                                duration: status,
                                position: player.queue.size,
                                requester: (track.requester as User).id,
                                title: track.title,
                                url: track.uri!,
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

            case "PLAYLIST":
                {
                    const track = result.tracks[0];

                    player.queue.add(result.tracks);

                    const embed = new Embed()
                        .setColor(client.config.color.success)
                        .setThumbnail(track.thumbnail)
                        .setDescription(
                            messages.commands.play.embed.playlist({
                                query,
                                playlist: result.playlistName ?? track.title,
                                requester: (track.requester as User).id,
                                tracks: result.tracks.length,
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
