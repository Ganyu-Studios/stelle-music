import { mkdir, readdir, readFile, stat, unlink, utimes, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Image } from "imagescript";
import type { ImageData } from "#stelle/types";
import { Configuration } from "#stelle/utils/data/configuration.js";
import { StellePaths } from "#stelle/utils/data/constants.js";

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

/**
 * Scale an image to cover a `size`×`size` square (like CSS `object-fit: cover`) and center-crop the overflow.
 * Unlike a fixed-window crop, this keeps the subject framed for any aspect ratio — square Spotify covers as
 * well as 16:9 YouTube thumbnails, which are also shorter than the art box and made a raw crop run out of bounds.
 * @param {Image} image The source image (mutated in place).
 * @param {number} size The target square side, in pixels.
 * @returns {Image} The cropped `size`×`size` image.
 */
function coverCrop(image: Image, size: number): Image {
    const scale: number = size / Math.min(image.width, image.height);
    image.resize(Math.max(size, Math.round(image.width * scale)), Math.max(size, Math.round(image.height * scale)));

    const x: number = Math.floor((image.width - size) / 2);
    const y: number = Math.floor((image.height - size) / 2);

    return image.crop(x, y, size, size);
}

/**
 * Render a single line of text sized to fit `maxWidth`. The size is first estimated from the text length, then
 * the string is truncated with an ellipsis until the rendered layer actually fits — the estimate alone can still
 * overflow for wide glyphs (e.g. long YouTube autoplay titles), which would spill over the art and the canvas edge.
 * @param {Buffer} font The font buffer.
 * @param {string} text The text to render.
 * @param {number} maxWidth The maximum layer width, in pixels.
 * @param {number} maxSize The maximum font size.
 * @param {number} minSize The minimum font size.
 * @param {number} color The text color.
 * @returns {Promise<Image>} The rendered text layer, guaranteed to fit `maxWidth`.
 */
async function renderFitted(font: Buffer, text: string, maxWidth: number, maxSize: number, minSize: number, color: number): Promise<Image> {
    const size: number = getFontSizeByLength(text, maxWidth, maxSize, minSize);

    let layer: Image = await Image.renderText(font, size, text, color);
    if (layer.width <= maxWidth) return layer;

    // Jump close to the fitting length in one step, then trim the last few characters precisely.
    let current: string = text.slice(0, Math.max(1, Math.floor((text.length * maxWidth) / layer.width) - 1)).trimEnd();
    layer = await Image.renderText(font, size, `${current}…`, color);

    while (layer.width > maxWidth && current.length > 1) {
        current = current.slice(0, -1).trimEnd();
        layer = await Image.renderText(font, size, `${current}…`, color);
    }

    return layer;
}

function lerpChannel(a: number, b: number, t: number): number {
    return Math.round(a + (b - a) * t);
}

function lerpColor(c1: number, c2: number, t: number): number {
    const r1 = (c1 >> 24) & 0xff,
        g1 = (c1 >> 16) & 0xff,
        b1 = (c1 >> 8) & 0xff,
        a1 = c1 & 0xff;
    const r2 = (c2 >> 24) & 0xff,
        g2 = (c2 >> 16) & 0xff,
        b2 = (c2 >> 8) & 0xff,
        a2 = c2 & 0xff;
    return Image.rgbaToColor(lerpChannel(r1, r2, t), lerpChannel(g1, g2, t), lerpChannel(b1, b2, t), lerpChannel(a1, a2, t));
}

function drawMusicNote(img: Image, x: number, y: number, color: number): void {
    const headW = 22,
        headH = 16;
    for (let dy = -headH / 2; dy < headH / 2; dy++) {
        for (let dx = -headW / 2; dx < headW / 2; dx++) {
            if ((dx * dx) / (headW / 2) ** 2 + (dy * dy) / (headH / 2) ** 2 <= 1) {
                img.setPixelAt(Math.round(x + dx) + 1, Math.round(y + dy) + 1, color);
            }
        }
    }
    for (let i = 0; i < 70; i++) {
        img.setPixelAt(Math.round(x + headW / 2 - 2) + 1, Math.round(y - i) + 1, color);
        img.setPixelAt(Math.round(x + headW / 2 - 1) + 1, Math.round(y - i) + 1, color);
    }
    for (let i = 0; i < 20; i++) {
        img.setPixelAt(Math.round(x + headW / 2 - 1 + i * 0.5) + 1, Math.round(y - 70 + i) + 1, color);
    }
}

function drawStar(img: Image, cx: number, cy: number, color: number): void {
    const size = 7;
    for (let i = -size; i <= size; i++) {
        img.setPixelAt(Math.round(cx + i) + 1, Math.round(cy) + 1, color);
        img.setPixelAt(Math.round(cx) + 1, Math.round(cy + i) + 1, color);
    }
    const diag = 4;
    for (let i = -diag; i <= diag; i++) {
        img.setPixelAt(Math.round(cx + i) + 1, Math.round(cy + i) + 1, color);
        img.setPixelAt(Math.round(cx + i) + 1, Math.round(cy - i) + 1, color);
    }
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

/**
 * The directory where rendered now-playing banners are cached on disk, one PNG per track identifier.
 * @type {string}
 */
const BANNERS_DIR: string = StellePaths.GetBannersDirectory();

/**
 * Resolve the on-disk path for a track's cached banner. Source identifiers are already url-safe (base62 /
 * 11-char / numeric ids), but any stray character is squashed so it never escapes the cache directory.
 * @param {string} identifier The track source identifier.
 * @returns {string} The absolute PNG path.
 */
function bannerPath(identifier: string): string {
    return join(BANNERS_DIR, `${identifier.replace(/[^a-zA-Z0-9._-]/g, "_")}.png`);
}

/**
 * Read a cached banner if present and still within its TTL. A hit refreshes the file's mtime, so the TTL is
 * sliding (time since last use) and the mtime doubles as the LRU recency signal used by {@link evictBanners}.
 * @param {string} identifier The track source identifier.
 * @param {number} ttl The maximum age since last use, in milliseconds.
 * @returns {Promise<Uint8Array | null>} The cached PNG buffer, or null on miss / stale / unreadable.
 */
async function readBannerCache(identifier: string, ttl: number): Promise<Uint8Array | null> {
    const file: string = bannerPath(identifier);

    try {
        const info = await stat(file);
        if (Date.now() - info.mtimeMs > ttl) {
            await unlink(file).catch((): null => null);
            return null;
        }

        const buffer: Buffer = await readFile(file);

        const now: Date = new Date();
        await utimes(file, now, now).catch((): null => null);

        return buffer;
    } catch {
        return null;
    }
}

/**
 * Write a rendered banner to the cache, then evict the least-recently-used entries beyond `maxEntries`.
 * Best-effort: any filesystem error is swallowed so caching never breaks rendering.
 * @param {string} identifier The track source identifier.
 * @param {Uint8Array} buffer The encoded PNG.
 * @param {number} maxEntries The maximum number of cached banners to keep.
 * @returns {Promise<void>} A promise that resolves once the banner is written and the cache is pruned.
 */
async function writeBannerCache(identifier: string, buffer: Uint8Array, maxEntries: number): Promise<void> {
    try {
        await mkdir(BANNERS_DIR, { recursive: true });
        await writeFile(bannerPath(identifier), buffer);
        await evictBanners(maxEntries);
    } catch {
        // Caching is best-effort; ignore write/eviction failures.
    }
}

/**
 * Drop the oldest cached banners (by mtime, i.e. least recently used) until at most `maxEntries` remain.
 * @param {number} maxEntries The maximum number of cached banners to keep.
 * @returns {Promise<void>} A promise that resolves once the cache is within the cap.
 */
async function evictBanners(maxEntries: number): Promise<void> {
    const files: string[] = await readdir(BANNERS_DIR).catch((): string[] => []);
    if (files.length <= maxEntries) return;

    const entries = await Promise.all(
        files.map(
            async (file): Promise<{ file: string; mtime: number }> => ({
                file,
                mtime: (await stat(join(BANNERS_DIR, file)).catch((): null => null))?.mtimeMs ?? 0,
            }),
        ),
    );

    entries.sort((a, b): number => a.mtime - b.mtime);

    const excess = entries.slice(0, entries.length - maxEntries);
    await Promise.all(
        excess.map(
            (entry): Promise<void> =>
                unlink(join(BANNERS_DIR, entry.file))
                    .then(() => {})
                    .catch((): void => {}),
        ),
    );
}

/**
 * The fixed dimensions of the idle request-channel banner.
 */
const IDLE_WIDTH: number = 960;
const IDLE_HEIGHT: number = 540;

/**
 * The idle request-channel banner palette, shared by the static backdrop and the dynamic overlay.
 */
const IDLE_COLORS = {
    BgTop: 0x11151dff,
    BgBottom: 0x1a2233ff,
    Accent: 0x6f8cffff,
    AccentSoft: 0x9db4ffff,
    Text: 0xf5f7ffff,
    SubText: 0xaeb8d6ff,
} as const;

/**
 * Memoized promise for the static idle-banner backdrop. The backdrop depends on neither the bot avatar nor
 * the locale, yet it is the expensive part to draw (a full-canvas gradient, grain pass, and per-pixel
 * radial glow), so it is rendered once and reused. Bounded to a single ~2MB image — no per-input cache.
 * @type {Promise<Image> | undefined}
 */
let idleBasePromise: Promise<Image> | undefined;

/**
 * Draw the static backdrop of the idle request-channel banner: the vertical gradient, grain texture,
 * diagonal staves, radial glow, decorative music notes, the accent divider, and the frame border. None of
 * this varies between renders, so {@link ImageOps.empty} clones the memoized result and only composites the
 * dynamic avatar and text on top.
 * @returns {Promise<Image>} The static backdrop, ready to be cloned.
 */
async function buildIdleBase(): Promise<Image> {
    const WIDTH: number = IDLE_WIDTH;
    const HEIGHT: number = IDLE_HEIGHT;

    const img: Image = new Image(WIDTH, HEIGHT);

    // 1. Vertical gradient background
    for (let y = 0; y < HEIGHT; y++) {
        const t = y / HEIGHT;
        const color = lerpColor(IDLE_COLORS.BgTop, IDLE_COLORS.BgBottom, t);
        for (let x = 0; x < WIDTH; x++) {
            img.setPixelAt(x + 1, y + 1, color);
        }
    }

    // 2. Subtle grain texture
    for (let i = 0; i < 14000; i++) {
        const x = Math.floor(Math.random() * WIDTH);
        const y = Math.floor(Math.random() * HEIGHT);
        const base = img.getPixelAt(x + 1, y + 1);
        const r = (base >> 24) & 0xff,
            g = (base >> 16) & 0xff,
            b = (base >> 8) & 0xff;
        const delta = Math.floor(Math.random() * 10) - 5;
        img.setPixelAt(
            x + 1,
            y + 1,
            Image.rgbaToColor(
                Math.min(255, Math.max(0, r + delta)),
                Math.min(255, Math.max(0, g + delta)),
                Math.min(255, Math.max(0, b + delta)),
                255,
            ),
        );
    }

    // 3. Diagonal stave lines
    const lineColor = Image.rgbaToColor(255, 255, 255, 10);
    for (let offset = -HEIGHT; offset < WIDTH; offset += 46) {
        for (let i = 0; i < Math.max(WIDTH, HEIGHT); i++) {
            const x = offset + i;
            const y = i;
            if (x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT) {
                img.setPixelAt(x + 1, y + 1, lineColor);
            }
        }
    }

    // 4. Soft radial glow
    const glow: Image = new Image(WIDTH, HEIGHT);
    const cx = WIDTH / 2,
        cy = HEIGHT / 2 - 20;
    const maxR = 340;
    for (let gy = 0; gy < HEIGHT; gy++) {
        for (let gx = 0; gx < WIDTH; gx++) {
            const d = Math.sqrt((gx - cx) ** 2 + (gy - cy) ** 2);
            const t = Math.min(1, d / maxR);
            const alpha = Math.round((1 - t) * 40);
            if (alpha > 0) {
                glow.setPixelAt(gx + 1, gy + 1, Image.rgbaToColor(111, 140, 255, alpha));
            } else {
                glow.setPixelAt(gx + 1, gy + 1, Image.rgbaToColor(0, 0, 0, 0));
            }
        }
    }
    img.composite(glow, 0, 0);

    // 5. Music notes
    drawMusicNote(img, WIDTH / 2 - 210, 150, IDLE_COLORS.AccentSoft);
    drawMusicNote(img, WIDTH / 2 + 190, 175, IDLE_COLORS.AccentSoft);

    // 6. Decorative line under title
    for (let lx = Math.round(WIDTH / 2 - 90); lx < Math.round(WIDTH / 2 + 90); lx++) {
        img.setPixelAt(lx + 1, 332, IDLE_COLORS.Accent);
        img.setPixelAt(lx + 1, 333, IDLE_COLORS.Accent);
    }

    // 7. Decorative frame border
    const borderColor = Image.rgbaToColor(255, 255, 255, 25);
    for (let bx = 0; bx < WIDTH; bx++) {
        img.setPixelAt(bx + 1, 23, borderColor);
        img.setPixelAt(bx + 1, HEIGHT - 22, borderColor);
    }
    for (let by = 0; by < HEIGHT; by++) {
        img.setPixelAt(23, by + 1, borderColor);
        img.setPixelAt(WIDTH - 22, by + 1, borderColor);
    }

    return img;
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
        const albumImage: Image = coverCrop(await ImageOps.album(albumURL), 504);

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
    /**
     *
     * Renders an "empty" style banner for the request-channel idle panel: a gradient card with the bot
     * avatar centered above the title, a prompt line, and a footer tag.
     * @param {Object} data The render data.
     * @param {string} [data.avatarURL] The bot avatar URL to display.
     * @param {string} data.title The title text shown in the panel.
     * @param {string} data.prompt The prompt text shown under the title.
     * @param {string} data.footer The footer tag shown at the bottom.
     * @returns {Promise<Uint8Array>} A Promise that resolves to a Uint8Array representing the encoded image.
     */
    async empty(data: { avatarURL?: string; title: string; prompt: string; footer: string }): Promise<Uint8Array> {
        const fontsPath: string = join(process.cwd(), "assets", "fonts");
        const font: Buffer<ArrayBuffer> = await readFile(join(fontsPath, "BoldFont.ttf"));

        const WIDTH: number = IDLE_WIDTH;

        // Clone the memoized static backdrop; only the avatar and text below vary between renders.
        idleBasePromise ??= buildIdleBase();
        const img: Image = (await idleBasePromise).clone();

        // Avatar (PFP) centered above title
        if (data.avatarURL) {
            try {
                const avatarBuffer: Buffer = await getBuffer(data.avatarURL);
                const avatarImage: Image = await Image.decode(avatarBuffer);
                const avatarSize = 80;
                avatarImage.resize(avatarSize, avatarSize);

                const ring: Image = new Image(avatarSize + 8, avatarSize + 8)
                    .fill(Image.rgbaToColor(255, 255, 255, 30))
                    .roundCorners((avatarSize + 8) / 2);

                img.composite(ring, Math.round((WIDTH - avatarSize) / 2) - 4, 86);
                img.composite(avatarImage.roundCorners(avatarSize / 2), Math.round((WIDTH - avatarSize) / 2), 90);
            } catch {
                // skip avatar on error
            }
        }

        // Typography
        const titleLayer: Image = await Image.renderText(font, 58, data.title, IDLE_COLORS.Text);
        img.composite(titleLayer, Math.round((WIDTH - titleLayer.width) / 2), 240);

        const subLayer: Image = await Image.renderText(font, 24, data.prompt, IDLE_COLORS.SubText);
        img.composite(subLayer, Math.round((WIDTH - subLayer.width) / 2), 360);

        const tagLayer: Image = await Image.renderText(font, 20, data.footer, IDLE_COLORS.AccentSoft);
        const tagX = Math.round((WIDTH - tagLayer.width) / 2);
        img.composite(tagLayer, tagX, 460);
        drawStar(img, tagX - 26, 470, IDLE_COLORS.AccentSoft);
        drawStar(img, tagX + tagLayer.width + 26, 470, IDLE_COLORS.AccentSoft);

        return img.encode();
    },
    /**
     *
     * Renders a lighter "banner" style image for the now-playing panel: the album art in a rounded
     * card frame on the left, with the track name and artist to the right, vertically centered. Meant
     * for panels where the rest of the metadata (author, duration, volume, requester, queue) is already
     * shown as embed fields, so the image itself doesn't need to repeat it.
     *
     * Unlike {@link ImageOps.render}, this draws its own frame procedurally instead of reusing
     * `border_w`/`border_b`.png, since those assets bake in fixed-position decorations (the header bar,
     * the "..." dots) meant for the full 1080x1350 layout and don't line up correctly on a banner canvas.
     *
     * The result is deterministic per track, so it is cached on disk by `identifier` (see
     * {@link readBannerCache}) when `config.images.enabled`, skipping both the artwork fetch and the render.
     * @param {Pick<ImageData, "albumURL" | "name" | "artist"> & { identifier: string }} data The track identifier, album URL, track name, and artist to render.
     * @returns {Promise<Uint8Array>} A Promise that resolves to a Uint8Array representing the encoded image.
     */
    async banner(data: Pick<ImageData, "albumURL" | "name" | "artist"> & { identifier: string }): Promise<Uint8Array> {
        const { albumURL, name, artist, identifier } = data;

        const { enabled, ttl, maxEntries } = Configuration.images;
        if (enabled) {
            const cached: Uint8Array | null = await readBannerCache(identifier, ttl);
            if (cached) return cached;
        }

        const fontsPath: string = join(process.cwd(), "assets", "fonts");
        const font: Buffer<ArrayBuffer> = await readFile(join(fontsPath, "BoldFont.ttf"));

        const WIDTH = 960;
        const HEIGHT = 540;
        const ART_SIZE = 420;
        const OUTER_BORDER = 14;
        const RADIUS = 48;
        const MARGIN = 60;

        const albumImage: Image = coverCrop(await ImageOps.album(albumURL), ART_SIZE);

        const dominant: number = albumImage.dominantColor();
        const opaque: boolean = isOpaque(Image.colorToRGB(dominant));
        const mainColor: number = opaque ? ImageColors.Text : ImageColors.Base;
        const layoutColor: number = opaque ? ImageColors.SubText : ImageColors.Surface;

        const textMaxWidth: number = WIDTH - (MARGIN + ART_SIZE + 50) - MARGIN;
        const trackText: Image = await renderFitted(font, name, textMaxWidth, 54, 24, mainColor);
        const artistText: Image = await renderFitted(font, artist, textMaxWidth, 38, 20, layoutColor);

        // 1. Card frame: a thin outer stroke (mainColor) with the dominant color filling the inside
        const outer: Image = new Image(WIDTH, HEIGHT).fill(mainColor).opacity(0.9).roundCorners(RADIUS);
        const inner: Image = new Image(WIDTH - OUTER_BORDER * 2, HEIGHT - OUTER_BORDER * 2)
            .fill(dominant)
            .roundCorners(RADIUS - OUTER_BORDER);
        const canvas: Image = new Image(WIDTH, HEIGHT).composite(outer, 0, 0).composite(inner, OUTER_BORDER, OUTER_BORDER);

        // 2. Album art on the left, with a thin ring around it
        const artX = MARGIN;
        const artY = (HEIGHT - ART_SIZE) / 2;
        const ring: Image = new Image(ART_SIZE + 16, ART_SIZE + 16)
            .fill(Image.rgbaToColor(255, 255, 255, 30))
            .roundCorners(RADIUS - OUTER_BORDER + 8);
        canvas.composite(ring, artX - 8, artY - 8);
        canvas.composite(albumImage.roundCorners(RADIUS - OUTER_BORDER), artX, artY);

        // 3. Track name and artist centered in the right-side area, both vertically centered against the art
        const textAreaLeft = artX + ART_SIZE + 50;
        const textAreaCenter = textAreaLeft + (WIDTH - MARGIN - textAreaLeft) / 2;
        const blockHeight = trackText.height + 14 + artistText.height;
        const textStartY = (HEIGHT - blockHeight) / 2;
        canvas.composite(trackText, Math.round(textAreaCenter - trackText.width / 2), textStartY);
        canvas.composite(artistText.opacity(0.9), Math.round(textAreaCenter - artistText.width / 2), textStartY + trackText.height + 14);

        const encoded: Uint8Array = await canvas.encode();
        if (enabled) await writeBannerCache(identifier, encoded, maxEntries);

        return encoded;
    },
};
