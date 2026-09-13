import { EventNames } from "hoshimi";
import { type ActionRow, type Button, Embed, LogLevels, type MessageStructure } from "seyfert";
import { TrackOps } from "#stelle/utils/functions/internal/track.js";
import { PanelOps } from "#stelle/utils/functions/manager/panel.js";
import { PlayerOps } from "#stelle/utils/functions/manager/player.js";
import { createLavalinkEvent } from "#stelle/utils/manager/events.js";

export default createLavalinkEvent({
    name: EventNames.TrackStart,
    async run(client, player, track): Promise<void> {
        if (!(player.textId && player.voiceId) || !track) return;

        const messages = await PlayerOps.messages(client, player);
        if (!messages) return;

        const voice = await PlayerOps.voice(client, player);
        if (!voice) return;

        // In quiz mode the engine drives its own UI: set a neutral voice status and never reveal the track here.
        if (await player.data.get("isQuiz")) {
            if (voice.isVoice()) await voice.setVoiceStatus(messages.events.quiz.voiceStatus).catch((): null => null);

            return;
        }

        if (voice.isVoice())
            await voice
                .setVoiceStatus(messages.events.voiceStatus.trackStart({ author: track.info.author, title: track.info.title }))
                .catch((): null => null);

        if (await player.data.get("isRequestChannel")) {
            // Persistent panel: edit the request-channel message in place instead of posting a new now-playing message.
            await PanelOps.update(client, player.guildId, player, track);
        } else {
            const isAutoplay: boolean = (await player.data.get("enabledAutoplay")) ?? false;

            const embed = new Embed()
                .setDescription(
                    messages.events.trackStart.embed({
                        duration: TrackOps.duration(track, messages),
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

            const components: ActionRow<Button>[] = PanelOps.controls(messages, { isAutoplay, loop: player.loop, paused: player.paused });

            const message: MessageStructure | null = await client.messages
                .write(player.textId, { embeds: [embed], components })
                .catch((): null => null);
            if (message) await player.data.set("messageId", message.id);
        }

        client.debug(
            LogLevels.Debug,
            `[Lavalink] Track started | guild: ${player.guildId} | title: ${track.info.title} | author: ${track.info.author}`,
        );
    },
});
