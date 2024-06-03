import { ActionRow, Button, type CommandContext, Embed, type User } from "seyfert";
import { Lavalink } from "#stelle/classes";

import { ButtonStyle } from "discord-api-types/v10";

import { AUTOPLAY_TYPE } from "#stelle/data/Constants.js";
import { parseTime } from "#stelle/utils/functions/utils.js";

export default new Lavalink({
    name: "playerStart",
    type: "kazagumo",
    run: async (client, player, track) => {
        if (!player.textId) return;

        const isAutoplay = (player.data.get("autoplay") as boolean | undefined) ?? false;

        const ctx = player.data.get("commandContext") as CommandContext | undefined;
        if (!ctx) return;

        const channel = await client.channels.fetch(player.textId);
        if (!channel.isTextGuild()) return;

        const voice = await client.channels.fetch(player.voiceId);
        if (!voice.isVoice()) return;

        const { messages } = ctx.t.get(await ctx.getLocale());

        const duration = track.isStream ? messages.commands.play.live : parseTime(track.length) ?? messages.commands.play.undetermined;

        const embed = new Embed()
            .setDescription(
                messages.events.playerStart.embed({
                    duration,
                    requester: (track.requester as User).id,
                    title: track.title,
                    url: track.uri!,
                    volume: player.volume,
                    author: track.author ?? "---",
                    size: player.queue.totalSize,
                }),
            )
            .setThumbnail(track.thumbnail)
            .setColor(client.config.color.extra)
            .setTimestamp();

        const row = new ActionRow<Button>().addComponents(
            new Button()
                .setCustomId("player-stopPlayer")
                .setStyle(ButtonStyle.Danger)
                .setLabel(messages.events.playerStart.components.stop),
            new Button()
                .setCustomId("player-skipTrack")
                .setStyle(ButtonStyle.Secondary)
                .setLabel(messages.events.playerStart.components.skip),
            new Button()
                .setCustomId("player-previousTrack")
                .setStyle(ButtonStyle.Secondary)
                .setLabel(messages.events.playerStart.components.previous),
            new Button()
                .setCustomId("player-guildQueue")
                .setStyle(ButtonStyle.Primary)
                .setLabel(messages.events.playerStart.components.queue),
        );

        const newRow = new ActionRow<Button>().addComponents(
            new Button()
                .setCustomId("player-toggleAutoplay")
                .setStyle(ButtonStyle.Primary)
                .setLabel(
                    messages.events.playerStart.components.autoplay({
                        type: messages.commands.autoplay.autoplayType[AUTOPLAY_TYPE(isAutoplay)],
                    }),
                ),
            new Button()
                .setCustomId("player-toggleLoop")
                .setStyle(ButtonStyle.Secondary)
                .setLabel(
                    messages.events.playerStart.components.loop({
                        type: messages.commands.loop.loopType[player.loop],
                    }),
                ),
            new Button()
                .setCustomId("player-pauseTrack")
                .setStyle(ButtonStyle.Primary)
                .setLabel(messages.events.playerStart.components.paused.pause),
        );

        const message = await channel.messages.write({ embeds: [embed], components: [row, newRow] }).catch(() => null);
        if (message) player.data.set("messageId", message.id);

        await voice.setVoiceState(`🎵 ${track.title}`);
    },
});
