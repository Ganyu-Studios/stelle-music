import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Image } from "imagescript";
import type { ImageData } from "#stelle/types";

/**
 * Colors used in the image rendering.
 */
const ImageColors = {
    /**
     * Text color.
     * @type {number}
     */
    Text: -841550593,
    /**
     * Subtext color.
     * @type {number}
     */
    SubText: -1161634049,
    /**
     * Surface color.
     * @type {number}
     */
    Surface: 1162304255,
    /**
     * Base background color.
     * @type {number}
     */
    Base: 505294591,
};

/**
 *
 * Get appropriate font size based on text length and maximum width.
 * @param {string} text Text to measure.
 * @param {number} maxWidth Maximum width allowed.
 * @param {number} maxFontSize Maximum font size.
 * @param {number} minFontSize Minimum font size.
 * @returns {number} Calculated font size.
 */
function getFontSizeByLength(text: string, maxWidth: number, maxFontSize: number, minFontSize: number): number {
    const avgCharFactor: number = 0.6;
    const length: number = [...text].length;

    for (let size: number = maxFontSize; size >= minFontSize; size--) {
        const estimatedWidth: number = length * size * avgCharFactor;

        if (estimatedWidth <= maxWidth) return size;
    }

    return minFontSize;
}

/**
 *
 * Determine if the color is opaque based on its RGB values.
 * @param {number[]} rgb RGB color array.
 * @returns {boolean} True if opaque, false otherwise.
 */
function isOpaque(rgb: number[]): boolean {
    const luminosity: number = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
    return !(luminosity > 0.5);
}

/**
 *
 * Calculate progress bar length.
 * @param {number} progress The current progress.
 * @param {number} total The total value.
 * @param {number} x The maximum x value.
 * @returns {number} Calculated progress value.
 */
function getProgress(progress: number, total: number, x: number): number {
    const prg: number = (progress / total) * x;

    if (Number.isNaN(prg) || prg < 0) return 0;
    if (prg > x) return x;

    return prg;
}

/**
 *
 * Fetch image from URL and return as buffer.
 * @param {string} url Image URL to fetch.
 * @returns {Promise<Buffer>} Image buffer.
 */
async function getBuffer(url: string): Promise<Buffer> {
    const res: Response = await fetch(url);
    return Buffer.from(await res.arrayBuffer());
}

/**
 *
 * Fetch album image or return placeholder.
 * @param {string | undefined} url The track album URL to fetch the image from.
 * @returns {Promise<Image>} The fetched album image or a placeholder image.
 */
export async function getAlbumImage(url: string | undefined): Promise<Image> {
    if (url) return Image.decode(await getBuffer(url));

    return new Image(100, 100).fill(ImageColors.Base);
}

/**
 *
 * Render an image based on provided data.
 * @param {ImageData} data Data for rendering the image.
 * @returns {Promise<Uint8Array>} Rendered image as Uint8Array.
 */
export async function renderImage(data: ImageData): Promise<Uint8Array> {
    const { albumURL, name, artist, timestamp, queue, guildName } = data;

    const fontsPath: string = join(process.cwd(), "assets", "fonts");
    const imagesPath: string = join(process.cwd(), "assets", "images", "nowplaying");

    const font: Buffer<ArrayBuffer> = await readFile(join(fontsPath, "BoldFont.ttf"));
    const albumImage: Image = await getAlbumImage(albumURL);

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
        .composite(albumImage.roundCorners(50).resize(504, 504), 288, 348)
        .composite(borderImage, 0, 0);

    return canvas.encode();
}
