import { ActionRow, Button, type CommandContext, Embed, type User } from "seyfert";
import { Lavalink } from "#stelle/classes";

import { ButtonStyle } from "discord-api-types/v10";

import { AUTOPLAY_STATE, PAUSE_STATE } from "#stelle/data/Constants.js";
import { parseTime } from "#stelle/utils/functions/utils.js";

export default new Lavalink({
    name: "trackStart",
    type: "manager",
    run: async (client, player, track) => {
        if (!(player.textChannelId && player.voiceChannelId)) return;

        const isAutoplay = player.get<boolean | undefined>("enabledAutoplay") ?? false;

        const ctx = player.get<CommandContext | undefined>("commandContext");
        if (!ctx) return;

        const voice = await client.channels.fetch(player.voiceChannelId);
        if (!voice.isVoice()) return;

        const { messages } = await ctx.getLocale();

        const duration = track.info.isStream
            ? messages.commands.play.live
            : parseTime(track.info.duration) ?? messages.commands.play.undetermined;

        const embed = new Embed()
            .setDescription(
                messages.events.playerStart.embed({
                    duration,
                    requester: (track.requester as User).id,
                    title: track.info.title,
                    url: track.info.uri,
                    volume: player.volume,
                    author: track.info.author,
                    size: player.queue.tracks.length,
                }),
            )
            .setThumbnail(track.info.artworkUrl ?? "")
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
                        type: messages.commands.autoplay.autoplayType[AUTOPLAY_STATE(isAutoplay)],
                    }),
                ),
            new Button()
                .setCustomId("player-toggleLoop")
                .setStyle(ButtonStyle.Secondary)
                .setLabel(
                    messages.events.playerStart.components.loop({
                        type: messages.commands.loop.loopType[player.repeatMode],
                    }),
                ),
            new Button()
                .setCustomId("player-pauseTrack")
                .setStyle(ButtonStyle.Primary)
                .setLabel(messages.events.playerStart.components.paused[PAUSE_STATE(player.paused)]),
        );

        const message = await client.messages.write(player.textChannelId, { embeds: [embed], components: [row, newRow] }).catch(() => null);
        if (message) player.set("messageId", message.id);
    },
});
