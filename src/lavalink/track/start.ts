import { ActionRow, Button, Embed } from "seyfert";
import { createLavalinkEvent } from "#stelle/utils/manager/events.js";

import { ButtonStyle } from "seyfert/lib/types/index.js";

import { LavalinkEventTypes, type StelleUser } from "#stelle/types";
import { TimeFormat } from "#stelle/utils/functions/time.js";

import { Constants } from "#stelle/utils/data/constants.js";

export default createLavalinkEvent({
    name: "trackStart",
    type: LavalinkEventTypes.Manager,
    async run(client, player, track): Promise<void> {
        if (!(player.textChannelId && player.voiceChannelId)) return;
        if (!track) return;

        const isAutoplay = player.get<boolean | undefined>("enabledAutoplay") ?? false;

        const locale = player.get<string | undefined>("localeString");
        if (!locale) return;

        const voice = await client.channels.fetch(player.voiceChannelId);
        if (!voice.is(["GuildStageVoice", "GuildVoice"])) return;

        const { messages } = client.t(locale).get();

        const duration = track.info.isStream
            ? messages.commands.play.live
            : (TimeFormat.toDotted(track.info.duration) ?? messages.commands.play.undetermined);

        const embed = new Embed()
            .setDescription(
                messages.events.trackStart.embed({
                    duration,
                    requester: (track.requester as StelleUser).id,
                    title: track.info.title,
                    url: track.info.uri,
                    volume: player.volume,
                    author: track.info.author,
                    size: player.queue.tracks.length,
                }),
            )
            .setThumbnail(track.info.artworkUrl ?? undefined)
            .setColor(client.config.color.extra)
            .setTimestamp();

        const components: ActionRow<Button>[] = [
            new ActionRow<Button>().addComponents(
                new Button()
                    .setCustomId("player-stopPlayer")
                    .setStyle(ButtonStyle.Danger)
                    .setLabel(messages.events.trackStart.components.stop),
                new Button()
                    .setCustomId("player-skipTrack")
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel(messages.events.trackStart.components.skip),
                new Button()
                    .setCustomId("player-previousTrack")
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel(messages.events.trackStart.components.previous),
                new Button()
                    .setCustomId("player-lyricsShow")
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel(messages.events.trackStart.components.lyrics),
                new Button()
                    .setCustomId("player-guildQueue")
                    .setStyle(ButtonStyle.Primary)
                    .setLabel(messages.events.trackStart.components.queue),
            ),
            new ActionRow<Button>().addComponents(
                new Button()
                    .setCustomId("player-toggleAutoplay")
                    .setStyle(ButtonStyle.Primary)
                    .setLabel(
                        messages.events.trackStart.components.autoplay({
                            type: messages.commands.autoplay.autoplayType[Constants.AutoplayState(isAutoplay)],
                        }),
                    ),
                new Button()
                    .setCustomId("player-toggleLoop")
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel(
                        messages.events.trackStart.components.loop({
                            type: messages.commands.loop.loopType[player.repeatMode],
                        }),
                    ),
                new Button()
                    .setCustomId("player-pauseTrack")
                    .setStyle(ButtonStyle.Primary)
                    .setLabel(messages.events.trackStart.components.paused[Constants.PauseState(player.paused)]),
            ),
        ];

        if (voice.isVoice())
            await voice
                .setVoiceStatus(
                    messages.events.voiceStatus.trackStart({
                        author: track.info.author,
                        title: track.info.title,
                    }),
                )
                .catch(() => null);

        const message = await client.messages.write(player.textChannelId, { embeds: [embed], components }).catch(() => null);
        if (message) player.set("messageId", message.id);

        if (Constants.Debug) client.debugger?.info(`Player: ${player.guildId} | Track Started: ${JSON.stringify(track)}`);
    },
});
