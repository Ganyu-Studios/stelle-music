import { ActionRow, Button, ComponentCommand, Embed, type GuildComponentContext, Middlewares } from "seyfert";
import { EmbedColors } from "seyfert/lib/common/index.js";
import { ButtonStyle, MessageFlags } from "seyfert/lib/types/index.js";

import { EmbedPaginator } from "#stelle/utils/paginator.js";

@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer", "checkTracks"])
export default class LyricsComponent extends ComponentCommand {
    override componentType = "Button" as const;
    override customId = "player-lyricsShow";

    async run(ctx: GuildComponentContext<typeof this.componentType>): Promise<void> {
        const { client } = ctx;

        const player = client.manager.getPlayer(ctx.guildId);
        if (!player) return;

        const track = player.queue.current;
        if (!track) return;

        const { messages } = await ctx.getLocale();

        const lyrics = await player.node.lyrics.getCurrent(ctx.guildId).catch(() => null);
        if (!lyrics)
            return ctx.editOrReply({
                flags: MessageFlags.Ephemeral,
                embeds: [
                    {
                        color: EmbedColors.Red,
                        description: messages.commands.lyrics.noLyrics,
                    },
                ],
            });

        if (typeof lyrics.provider !== "string") lyrics.provider = "Unknown";

        lyrics.provider = lyrics.provider.replace("Source:", "").trim();

        if (!Array.isArray(lyrics.lines)) {
            if (!lyrics.text)
                return ctx.editOrReply({
                    flags: MessageFlags.Ephemeral,
                    embeds: [
                        {
                            color: EmbedColors.Red,
                            description: messages.commands.lyrics.noLyrics,
                        },
                    ],
                });

            const paginator = new EmbedPaginator({ ctx });
            const lines = lyrics.text.split("\n");

            for (let i = 0; i < lines.length; i += client.config.lyricsLines) {
                paginator.addEmbed(
                    new Embed()
                        .setThumbnail(track.info.artworkUrl ?? undefined)
                        .setColor(client.config.color.extra)
                        .setTitle(messages.commands.lyrics.embed.title({ title: track.info.title }))
                        .setFooter({
                            iconUrl: ctx.author.avatarURL(),
                            text: messages.commands.lyrics.embed.footer({ userName: ctx.author.tag }),
                        })
                        .setDescription(
                            messages.commands.lyrics.embed.description({
                                lines: lines.slice(i, i + client.config.lyricsLines).join("\n"),
                                author: track.info.author,
                                provider: lyrics.provider,
                            }),
                        ),
                );
            }

            await paginator.reply();

            return;
        }

        const lines = lyrics.lines
            .slice(0, client.config.lyricsLines)
            .map((l, i) => (i === 0 ? `**${l.line}**` : `-# ${l.line}`))
            .join("\n");
        const embed = new Embed()
            .setThumbnail(track.info.artworkUrl ?? undefined)
            .setColor(client.config.color.extra)
            .setTitle(messages.commands.lyrics.embed.title({ title: track.info.title }))
            .setFooter({
                iconUrl: ctx.author.avatarURL(),
                text: messages.commands.lyrics.embed.footer({ userName: ctx.author.tag }),
            })
            .setDescription(
                messages.commands.lyrics.embed.description({
                    lines,
                    author: track.info.author,
                    provider: lyrics.provider,
                }),
            );

        const row = new ActionRow<Button>().addComponents(
            new Button().setCustomId("player-lyricsDelete").setLabel(messages.commands.lyrics.close).setStyle(ButtonStyle.Secondary),
        );

        const message = await ctx.editOrReply({ embeds: [embed], components: [row] }, true);

        // cuz this returns an exception, idk why
        if (!player.get<boolean | undefined>("lyricsEnabled")) await player.node.lyrics.subscribe(ctx.guildId).catch(() => null);

        player.set("lyrics", lyrics);
        player.set("lyricsId", message.id);
        player.set("lyricsEnabled", true);
    }
}
