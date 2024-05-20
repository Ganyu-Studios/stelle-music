import { type CommandContext, Declare, LocalesT, Options, createStringOption } from "seyfert";
import { StelleCommand } from "#stelle/classes";
import { StelleOptions } from "#stelle/decorators";

const options = {
    query: createStringOption({
        description: "Enter the song name/url.",
        required: true,
        locales: {
            name: "locales.play.option.name",
            description: "locales.play.option.description",
        },
    }),
};

@Declare({
    name: "play",
    description: "Play music with Stelle.",
    aliases: ["p"],
})
@StelleOptions({ cooldown: 5, inVoice: true, sameVoice: true })
@Options(options)
@LocalesT("locales.play.name", "locales.play.description")
export default class PlayCommand extends StelleCommand {
    async run(ctx: CommandContext<typeof options>) {
        const { options, client, guildId, channelId, member, author } = ctx;
        const { query } = options;

        if (!(guildId && member)) return;

        const voice = member.voice();
        if (!voice) return;

        const botVoice = ctx.me()?.voice();
        if (botVoice && botVoice.channelId !== voice.channelId) return;

        const player = await client.manager.createPlayer({
            guildId: guildId,
            textId: channelId,
            voiceId: voice.channelId,
            volume: 100,
        });

        const result = await client.manager.search(query, { requester: author, engine: "spotify" });
        if (!result.tracks.length) return ctx.editOrReply({ content: "No results found!" });

        if (result.type === "PLAYLIST") player.queue.add(result.tracks);
        else player.queue.add(result.tracks[0]);

        if (!player.playing) await player.play();

        return ctx.editOrReply({
            content:
                result.type === "PLAYLIST"
                    ? `Queued ${result.tracks.length} from ${result.playlistName}`
                    : `Queued ${result.tracks[0].title}`,
        });
    }
}
