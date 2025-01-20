import { ActionRow, Button, ComponentCommand, type ComponentContext, Embed, Middlewares } from "seyfert";
import { EmbedColors } from "seyfert/lib/common/index.js";
import { ButtonStyle, MessageFlags } from "seyfert/lib/types/index.js";

@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer", "checkTracks"])
export default class LyricsComponent extends ComponentCommand {
    componentType = "Button" as const;

    filter(ctx: ComponentContext<typeof this.componentType>): boolean {
        return ctx.customId === "player-lyricsShow";
    }

    async run(ctx: ComponentContext<typeof this.componentType>): Promise<void> {
        const { client } = ctx;

        if (!ctx.guildId) return;

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

        player.set("lyrics", lyrics);

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
                    provider: lyrics.provider,
                }),
            );

        const row = new ActionRow<Button>().addComponents(
            new Button().setCustomId("player-lyricsClose").setLabel(messages.commands.lyrics.close).setStyle(ButtonStyle.Secondary),
        );

        const message = await ctx.editOrReply({ embeds: [embed], components: [row] }, true);

        // cuz this returns an exception, idk why
        await player.node.lyrics.subscribe(ctx.guildId).catch(() => null);

        player.set("lyricsId", message.id);
    }
}
