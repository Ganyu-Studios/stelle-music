import { type LyricsLine, LyricsManager, type LyricsResult, type PlayerStructure, RestRoutes, type TrackStructure } from "hoshimi";
import type { NodelinkLyrics } from "#stelle/types";

/**
 * Class representing a lyrics manager for Hoshimi with Nodelink support.
 * @class HoshimiLyricsManager
 * @extends {LyricsManager}
 */
export class HoshimiLyricsManager extends LyricsManager {
    public override async current(guildId: string, skipSource?: boolean): Promise<LyricsResult | null> {
        if (this.node.isNodelink()) {
            const player: PlayerStructure | undefined = this.node.nodeManager.manager.getPlayer(guildId);
            if (!player) return Promise.resolve(null);

            const current: TrackStructure | null = player.queue.current;
            if (!current) return Promise.resolve(null);

            return this.get(current, skipSource);
        }

        return super.current(guildId, skipSource);
    }

    public override async get(track: TrackStructure, skipSource?: boolean): Promise<LyricsResult | null> {
        if (this.node.isNodelink()) {
            const lyrics: NodelinkLyrics | null = await this.node.rest.request<NodelinkLyrics>({
                endpoint: RestRoutes.LoadLyrics,
                params: {
                    encodedTrack: track.encoded,
                    skipSource: `${skipSource ?? false}`,
                },
            });

            if (!lyrics || lyrics.loadType === "empty" || lyrics.loadType === "error" || !lyrics.data.lines.length) return null;

            const lines: LyricsLine[] = lyrics.data.lines.map((line) => ({
                line: line.text,
                duration: line.duration ?? 0,
                timestamp: line.time ?? 0,
                plugin: {},
            }));

            return {
                lines,
                plugin: {},
                provider: lyrics.data.provider || "unknown",
                sourceName: lyrics.data.source || "unknown",
                text: null,
            };
        }

        return super.get(track, skipSource);
    }
}
