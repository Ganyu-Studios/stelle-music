import { EventNames } from "hoshimi";
import { ActionRow, type AllChannels, Button, Embed, type MessageStructure } from "seyfert";
import { ButtonStyle } from "seyfert/lib/types/index.js";
import { Constants } from "#stelle/utils/data/constants.js";
import { TimeFormat } from "#stelle/utils/functions/time.js";
import { createLavalinkEvent } from "#stelle/utils/manager/events.js";

export default createLavalinkEvent({
    name: EventNames.TrackStart,
    async run(client, player, track): Promise<void> {
        if (!(player.textId && player.voiceId)) return;
        if (!track) return;

        const isAutoplay: boolean = (await player.data.get("enabledAutoplay")) ?? false;
        const locale: string | undefined = await player.data.get("localeString");
        if (!locale) return;

        const voice: AllChannels = await client.channels.fetch(player.voiceId);
        if (!voice.is(["GuildStageVoice", "GuildVoice"])) return;

        const { messages } = client.t(locale).get();

        const duration: string = track.info.isStream
            ? messages.commands.play.live
            : (TimeFormat.toDotted(track.info.length) ?? messages.commands.play.undetermined);

        const embed = new Embed()
            .setDescription(
                messages.events.trackStart.embed({
                    duration,
                    requester: track.requester.id,
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
                            type: messages.commands.loop.loopType[player.loop],
                        }),
                    ),
                new Button()
                    .setCustomId("player-pauseTrack")
                    .setStyle(ButtonStyle.Primary)
                    .setLabel(messages.events.trackStart.components.states[Constants.PauseState(player.paused)]),
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
                .catch((): null => null);

        const message: MessageStructure | null = await client.messages
            .write(player.textId, { embeds: [embed], components })
            .catch((): null => null);
        if (message) await player.data.set("messageId", message.id);

        if (Constants.Debug) client.debugger?.info(`[Player ${player.guildId}] Track Started: ${JSON.stringify(track)}`);
    },
});
