import type { LyricsResult } from "lavalink-client";
import { LavalinkEventTypes } from "#stelle/types";
import { createLavalinkEvent } from "#stelle/utils/manager/events.js";

export default createLavalinkEvent({
    name: "LyricsLine",
    type: LavalinkEventTypes.Manager,
    async run(client, player, track, payload): Promise<void> {
        if (!(player.get<boolean | undefined>("lyricsEnabled") && player.textChannelId)) return;

        if (payload.skipped) return;

        const lyricsId = player.get<string | undefined>("lyricsId");
        if (!lyricsId) return;

        const message = await client.messages.fetch(lyricsId, player.textChannelId).catch(() => null);
        if (!message) return;

        const lyrics = player.get<LyricsResult | undefined>("lyrics");
        if (!lyrics) {
            await message.delete().catch(() => null);

            if (player.get<boolean | undefined>("lyricsEnabled")) await player.node.lyrics.unsubscribe(player.guildId).catch(() => null);

            player.set("lyricsId", undefined);
            player.set("lyrics", undefined);
            player.set("lyricsEnabled", true);

            return;
        }

        const embed = message.embeds.at(0)?.toBuilder();
        if (!embed) return;

        const locale = player.get<string | undefined>("localeString");
        if (!locale) return;

        const { messages } = client.t(locale).get();

        const totalLines = client.config.lyricsLines + 1;
        const index = payload.lineIndex;

        let start = Math.max(0, index - Math.floor(totalLines / 2));
        if (start + totalLines > lyrics.lines.length) start = Math.max(0, lyrics.lines.length - totalLines);

        const end = Math.min(lyrics.lines.length, start + totalLines);

        const lines = lyrics.lines
            .slice(start, end)
            .map((l, i) => {
                if (!l.line.length) return "-# ...";
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
