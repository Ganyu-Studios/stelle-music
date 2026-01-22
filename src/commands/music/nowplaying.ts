import type { Image } from "imagescript";
import type { Player, Track } from "lavalink-client";
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
    type Message,
    Middlewares,
    TextDisplay,
    type WebhookMessage,
} from "seyfert";
import { EmbedColors } from "seyfert/lib/common/index.js";
import { MessageFlags } from "seyfert/lib/types/index.js";
import { StelleCategory } from "#stelle/types";
import { StelleOptions } from "#stelle/utils/decorator.js";
import { getAlbumImage, renderImage } from "#stelle/utils/functions/image.js";
import { ms, TimeFormat } from "#stelle/utils/functions/time.js";
import { truncate } from "#stelle/utils/functions/utils.js";

@Declare({
    name: "nowplaying",
    description: "Get the current playing track.",
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"],
    aliases: ["np"],
})
@StelleOptions({ cooldown: 5, category: StelleCategory.Music })
@LocalesT("locales.nowplaying.name", "locales.nowplaying.description")
@Middlewares(["checkNodes", "checkPlayer"])
export default class NowPlayingCommand extends Command {
    public override async run(ctx: GuildCommandContext): Promise<Message | WebhookMessage | void> {
        const { client } = ctx;

        const { messages } = await ctx.locale();

        const player: Player | undefined = client.manager.getPlayer(ctx.guildId);
        if (!player) return;

        const track: Track | null = player.queue.current;
        if (!track)
            return ctx.editOrReply({
                embeds: [
                    {
                        description: messages.events.noPlayer,
                        color: EmbedColors.Red,
                    },
                ],
            });

        await ctx.deferReply();

        const start: number = Date.now();

        const guild: Guild<"api" | "cached"> = await ctx.guild();
        const image: Uint8Array = await renderImage({
            name: truncate(track.info.title, 50),
            artist: truncate(track.info.author, 50),
            albumURL: track.info.artworkUrl ?? undefined,
            guildName: guild.name,
            timestamp: {
                progress: player.position,
                end: track.info.duration,
                progressStart: TimeFormat.toDotted(player.position),
                progressEnd: TimeFormat.toDotted(track.info.duration),
            },
            queue: {
                current: 1,
                total: player.queue.tracks.length + 1,
            },
        });

        const albumImage: Image = await getAlbumImage(track.info.artworkUrl ?? undefined);
        const dominantColor: number = albumImage.dominantColor();
        const embedColor: number = (dominantColor >> 8) & 0xffffff;

        const attachment: AttachmentBuilder = new AttachmentBuilder().setName(`${this.name}.png`).setFile("buffer", Buffer.from(image));
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
