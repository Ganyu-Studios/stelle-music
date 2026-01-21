import fs from "node:fs";
import { join } from "node:path";
import { Image as IS } from "imagescript";
import {
    AttachmentBuilder,
    Command,
    Declare,
    type GuildCommandContext,
    LocalesT,
    type Message,
    Middlewares,
    type WebhookMessage,
} from "seyfert";
import { EmbedColors } from "seyfert/lib/common/index.js";
import { StelleCategory } from "#stelle/types";
import { StelleOptions } from "#stelle/utils/decorator.js";
import { TimeFormat } from "#stelle/utils/functions/time.js";

const colors = {
    text: -841550593,
    subtext: -1161634049,
    surface: 1162304255,
    base: 505294591,
};

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

        const player = client.manager.getPlayer(ctx.guildId);
        if (!player) return;

        const track = player.queue.current;
        if (!track)
            return ctx.editOrReply({
                embeds: [
                    {
                        description: messages.events.noPlayer,
                        color: EmbedColors.Red,
                    },
                ],
            });

        const guild = await ctx.guild();
        const image = await this.renderImage({
            name: this.cutText(track.info.title, 50),
            artist: this.cutText(track.info.author, 50),
            albumURL: track.info.artworkUrl ?? undefined,
            timestamp: {
                progress: player.position,
                end: track.info.duration,
                pProgress: TimeFormat.toDotted(player.position),
                pEnd: TimeFormat.toDotted(track.info.duration),
            },
            queue: {
                current: 1,
                total: player.queue.tracks.length + 1,
            },
            guildName: guild.name,
        });

        const attachment = new AttachmentBuilder().setName(`${this.name}.png`).setFile("buffer", Buffer.from(image));

        await ctx.editOrReply({ files: [attachment] });
    }

    private async renderImage(data: ImageData): Promise<Uint8Array> {
        const { albumURL, name, artist, timestamp, queue, guildName } = data;

        const font = fs.readFileSync(join(process.cwd(), "assets", "fonts", "BoldFont.ttf"));

        const albumImage = albumURL ? await IS.decode(await this.getBuffer(albumURL)) : new IS(100, 100).fill(colors.base);

        const dominant = albumImage.dominantColor();
        const opaque = this.opaque(IS.colorToRGB(dominant));
        const mainColor = opaque ? colors.text : colors.base;

        const borderImage = await IS.decode(
            fs.readFileSync(join(process.cwd(), "assets", "images", "nowplaying", `border_${opaque ? "w" : "b"}.png`)),
        );

        const songText = await IS.renderText(font, this.getFontSizeByLength(name, 940, 65.3, 25), name, mainColor);
        const artistText = await IS.renderText(
            font,
            this.getFontSizeByLength(artist, 940, 51.5, 25),
            artist,
            opaque ? colors.subtext : colors.surface,
        );
        const guildText = await IS.renderText(font, 65.3, guildName, mainColor);

        const progressBackground = new IS(858, 151).fill(mainColor).roundCorners(30);
        const progressFill = new IS(this.getProgress(timestamp.progress, timestamp.end, 858), 151).fill(mainColor).roundCorners(30);

        const text = new IS(1080, 905);
        const centerX = text.width / 2;

        text.composite(songText, centerX - songText.width / 2, 803 - 20)
            .composite(artistText.opacity(0.9), centerX - artistText.width / 2, 876 - 20)
            .composite(guildText, centerX - guildText.width / 2, 0)
            .composite(progressBackground.opacity(0.5), 111, 414)
            .composite(progressFill, 111, 414)
            .composite(await IS.renderText(font, 35.2, timestamp.pProgress, mainColor), 206 - 30, 584 - 10)
            .composite(await IS.renderText(font, 35.2, timestamp.pEnd, mainColor), 802, 584 - 10)
            .composite(await IS.renderText(font, 47.5, `${queue.current}/${queue.total}`, mainColor), 140, 128 - 20);

        const canvas = new IS(1080, 1350)
            .fill(dominant)
            .composite(text, 0, 100)
            .composite(albumImage.roundCorners(50).resize(504, 504), 288, 348)
            .composite(borderImage, 0, 0);

        return canvas.encode();
    }

    private async getBuffer(url: string): Promise<Buffer> {
        const res = await fetch(url);
        return Buffer.from(await res.arrayBuffer());
    }

    private cutText(text: string, maxLength: number): string {
        if (text.length <= maxLength) return text;
        return text.slice(0, maxLength - 3) + "...";
    }

    private getFontSizeByLength(text: string, maxWidth: number, maxFontSize: number, minFontSize: number): number {
        const avgCharFactor = 0.6;
        const length = [...text].length;

        for (let size = maxFontSize; size >= minFontSize; size--) {
            const estimatedWidth = length * size * avgCharFactor;

            if (estimatedWidth <= maxWidth) return size;
        }

        return minFontSize;
    }

    private opaque(rgb: number[]): boolean {
        const luminosity = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
        return !(luminosity > 0.5);
    }

    private getProgress(progress: number, total: number, x: number): number {
        const prg = (progress / total) * x;
        if (Number.isNaN(prg) || prg < 0) return 0;
        if (prg > x) return x;
        return prg;
    }
}

type ImageData = {
    name: string;
    artist: string;
    timestamp: {
        progress: number;
        end: number;
        pProgress: string;
        pEnd: string;
    };
    albumURL: string | undefined;
    queue: {
        current: number;
        total: number;
    };
    guildName: string;
};
