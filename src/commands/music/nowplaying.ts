import type { TrackStructure } from "hoshimi";
import type { Image } from "imagescript";
import {
    AttachmentBuilder,
    Command,
    Container,
    Declare,
    type Guild,
    type GuildCommandContext,
    LocalesT,
    MediaGallery,
    MediaGalleryItem,
    type MessageStructure,
    Middlewares,
    TextDisplay,
    type WebhookMessageStructure,
} from "seyfert";
import { ApplicationIntegrationType, InteractionContextType, MessageFlags } from "seyfert/lib/types/index.js";
import { StelleCategory } from "#stelle/types";
import { StelleOptions } from "#stelle/utils/decorator.js";
import { ImageOps } from "#stelle/utils/functions/internal/image.js";
import { ms, TimeFormat } from "#stelle/utils/functions/internal/time.js";
import { UtilsOps } from "#stelle/utils/functions/internal/utils.js";

@Declare({
    name: "nowplaying",
    description: "Get the current playing track.",
    integrationTypes: [ApplicationIntegrationType.GuildInstall],
    contexts: [InteractionContextType.Guild],
    aliases: ["np"],
})
@StelleOptions({ cooldown: 5, category: StelleCategory.Music })
@LocalesT("locales.nowplaying.name", "locales.nowplaying.description")
@Middlewares(["checkNodes", "checkPlayer"])
export default class NowPlayingCommand extends Command {
    public override async run(ctx: GuildCommandContext<{}, "checkPlayer">): Promise<MessageStructure | WebhookMessageStructure | void> {
        const { messages } = await ctx.locale();

        const { player } = ctx.metadata.checkPlayer;

        const track: TrackStructure | null = player.queue.current;
        if (!track) return ctx.errorReply(messages.events.noPlayer);

        await ctx.deferReply();

        const start: number = Date.now();

        const guild: Guild<"api" | "cached"> = await ctx.guild();
        const image: Uint8Array = await ImageOps.render({
            name: UtilsOps.truncate(track.info.title, 50),
            artist: UtilsOps.truncate(track.info.author, 50),
            albumURL: track.info.artworkUrl ?? undefined,
            guildName: guild.name,
            timestamp: {
                progress: player.position,
                end: track.info.length,
                progressStart: TimeFormat.toDotted(player.position),
                progressEnd: TimeFormat.toDotted(track.info.length),
            },
            queue: {
                current: 1,
                total: player.queue.tracks.length + 1,
            },
        });

        const albumImage: Image = await ImageOps.album(track.info.artworkUrl ?? undefined);
        const dominantColor: number = albumImage.dominantColor();
        const embedColor: number = (dominantColor >> 8) & 0xffffff;

        const attachment: AttachmentBuilder = new AttachmentBuilder().setName(`${this.name}.png`).setFile("buffer", image);
        const container: Container = new Container().setColor(embedColor).addComponents(
            new MediaGallery().addItems(new MediaGalleryItem().setMedia(`attachment://${this.name}.png`)),
            new TextDisplay().setContent(
                messages.commands.nowplaying({
                    userName: ctx.author.tag,
                    time: ms(Date.now() - start),
                }),
            ),
        );

        await ctx.editOrReply({
            flags: MessageFlags.IsComponentsV2,
            components: [container],
            files: [attachment],
        });
    }
}
