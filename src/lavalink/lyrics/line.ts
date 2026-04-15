import { EventNames, type LyricsResult } from "hoshimi";
import type { Embed, MessageStructure } from "seyfert";
import { createLavalinkEvent } from "#stelle/utils/manager/events.js";

export default createLavalinkEvent({
    name: EventNames.LyricsLine,
    async run(client, player, track, payload): Promise<void> {
        if (payload.skipped) return;

        if (!(await player.data.get("lyricsEnabled"))) return;
        if (!player.textId) return;

        const lyricsId: string | undefined = await player.data.get("lyricsId");
        if (!lyricsId) return;

        const message: MessageStructure | null = await client.messages.fetch(lyricsId, player.textId).catch((): null => null);
        if (!message) return;

        const lyrics: LyricsResult | undefined = await player.data.get("lyrics");
        if (!lyrics) {
            await message.delete().catch((): null => null);

            await player.data.delete("lyricsId");
            await player.data.delete("lyrics");

            return;
        }

        const embed: Embed | undefined = message.embeds.at(0)?.toBuilder();
        if (!embed) return;

        const locale: string | undefined = await player.data.get("localeString");
        if (!locale) return;

        const { messages } = client.t(locale).get();

        const totalLines: number = client.config.lyricsLines + 1;
        const index: number = payload.lineIndex;

        let start: number = Math.max(0, index - Math.floor(totalLines / 2));
        if (start + totalLines > lyrics.lines.length) start = Math.max(0, lyrics.lines.length - totalLines);

        const end: number = Math.min(lyrics.lines.length, start + totalLines);

        const lines: string = lyrics.lines
            .slice(start, end)
            .map((l, i): string => {
                if (!l.line.length) l.line = "...";
                return i + start === index ? `**${l.line}**` : `-# ${l.line}`;
            })
            .join("\n");

        embed.setDescription(
            messages.commands.lyrics.embed.description({
                lines,
                provider: lyrics.provider,
                author: track?.info.author ?? "Unknown",
            }),
        );

        await message.edit({ embeds: [embed] });
    },
});
