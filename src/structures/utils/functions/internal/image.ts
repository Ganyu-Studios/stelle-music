import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Image } from "imagescript";
import type { ImageData } from "#stelle/types";

const ImageColors = {
    Text: -841550593,
    SubText: -1161634049,
    Surface: 1162304255,
    Base: 505294591,
};

function getFontSizeByLength(text: string, maxWidth: number, maxFontSize: number, minFontSize: number): number {
    const avgCharFactor: number = 0.6;
    const length: number = [...text].length;

    for (let size: number = maxFontSize; size >= minFontSize; size--) {
        const estimatedWidth: number = length * size * avgCharFactor;

        if (estimatedWidth <= maxWidth) return size;
    }

    return minFontSize;
}

function isOpaque(rgb: number[]): boolean {
    const luminosity: number = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
    return !(luminosity > 0.5);
}

function getProgress(progress: number, total: number, x: number): number {
    const prg: number = (progress / total) * x;

    if (Number.isNaN(prg) || prg < 0) return 0;
    if (prg > x) return x;

    return prg;
}

async function getBuffer(url: string): Promise<Buffer> {
    const res: Response = await fetch(url);
    return Buffer.from(await res.arrayBuffer());
}

export const ImageOps = {
    /**
     *
     * Fetches and decodes an album image from a given URL. If the URL is undefined, it returns a default 100x100 image filled with a base color.
     * @param {string | undefined} url The URL of the album image to fetch and decode.
     * @returns {Promise<Image>} A Promise that resolves to an Image object. If the URL is undefined, it returns a default 100x100 image filled with a base color.
     */
    async album(url: string | undefined): Promise<Image> {
        if (url) return Image.decode(await getBuffer(url));

        return new Image(100, 100).fill(ImageColors.Base);
    },
    /**
     *
     * Renders an image based on the provided ImageData, including album art, text, and progress bar.
     * @param {ImageData} data The data required to render the image, including album URL, track name, artist, timestamp, queue information, and guild name.
     * @returns {Promise<Uint8Array>} A Promise that resolves to a Uint8Array representing the encoded image.
     */
    async render(data: ImageData): Promise<Uint8Array> {
        const { albumURL, name, artist, timestamp, queue, guildName } = data;

        const fontsPath: string = join(process.cwd(), "assets", "fonts");
        const imagesPath: string = join(process.cwd(), "assets", "images", "nowplaying");

        const font: Buffer<ArrayBuffer> = await readFile(join(fontsPath, "BoldFont.ttf"));
        const albumImage: Image = await ImageOps.album(albumURL);

        if (albumImage.width === albumImage.height) albumImage.resize(504, 504);
        else albumImage.crop((albumImage.width - 504) / 2, (albumImage.height - 504) / 2, 504, 504);

        const dominant: number = albumImage.dominantColor();
        const opaque: boolean = isOpaque(Image.colorToRGB(dominant));
        const mainColor: number = opaque ? ImageColors.Text : ImageColors.Base;

        const borderType: "w" | "b" = opaque ? "w" : "b";
        const borderBuffer: Buffer<ArrayBuffer> = await readFile(join(imagesPath, `border_${borderType}.png`));
        const borderImage: Image = await Image.decode(borderBuffer);

        const layoutColor: number = opaque ? ImageColors.SubText : ImageColors.Surface;
        const fontSize: number = getFontSizeByLength(artist, 940, 51.5, 25);

        const trackText: Image = await Image.renderText(font, getFontSizeByLength(name, 940, 65.3, 25), name, mainColor);
        const artistText: Image = await Image.renderText(font, fontSize, artist, layoutColor);
        const guildText: Image = await Image.renderText(font, 65.3, guildName, mainColor);

        const progressBackground: Image = new Image(858, 151).fill(mainColor).roundCorners(30);
        const progressFill: Image = new Image(getProgress(timestamp.progress, timestamp.end, 858), 151).fill(mainColor).roundCorners(30);

        const text: Image = new Image(1080, 905);
        const centerX: number = text.width / 2;

        text.composite(trackText, centerX - trackText.width / 2, 803 - 20)
            .composite(artistText.opacity(0.9), centerX - artistText.width / 2, 876 - 20)
            .composite(guildText, centerX - guildText.width / 2, 0)
            .composite(progressBackground.opacity(0.5), 111, 414)
            .composite(progressFill, 111, 414)
            .composite(await Image.renderText(font, 35.2, timestamp.progressStart, mainColor), 206 - 30, 584 - 10)
            .composite(await Image.renderText(font, 35.2, timestamp.progressEnd, mainColor), 802, 584 - 10)
            .composite(await Image.renderText(font, 47.5, `${queue.current}/${queue.total}`, mainColor), 140, 128 - 20);

        const canvas: Image = new Image(1080, 1350)
            .fill(dominant)
            .composite(text, 0, 100)
            .composite(albumImage.roundCorners(50), 288, 348)
            .composite(borderImage, 0, 0);

        return canvas.encode();
    },
};
