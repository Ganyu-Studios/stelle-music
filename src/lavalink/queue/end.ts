import { EventNames } from "hoshimi";
import { Embed } from "seyfert";
import { StelleMeta } from "#stelle/utils/data/constants.js";
import { clearNowPlaying, clearPlayerLyrics, fetchPlayerVoice, getPlayerMessages } from "#stelle/utils/functions/manager/player.js";
import { createLavalinkEvent } from "#stelle/utils/manager/events.js";

export default createLavalinkEvent({
    name: EventNames.QueueEnd,
    async run(client, player): Promise<void> {
        if (!(player.textId && player.voiceId)) return;

        // only unsubscribe if the queue is ended.
        await clearPlayerLyrics(client, player, player.textId, { unsubscribe: true, clearEnabled: true });
        await clearNowPlaying(client, player, player.textId);

        const messages = await getPlayerMessages(client, player);
        if (!messages) return;

        const voice = await fetchPlayerVoice(client, player);
        if (!voice) return;

        if (voice.isVoice()) await voice.setVoiceStatus(messages.events.voiceStatus.queueEnd).catch((): null => null);

        const embed = new Embed().setDescription(messages.events.playerEnd).setColor(client.config.color.success).setTimestamp();

        await client.messages.write(player.textId, { embeds: [embed] }).catch((): null => null);
        await player.data.delete("messageId");

        const autoplay: boolean = !!(await player.data.get("enabledAutoplay"));

        if (StelleMeta.Debug)
            client.debugger?.info(
                `[Lavalink] Queue ended | guild: ${player.guildId} | remaining: ${player.queue.tracks.length} | autoplay: ${autoplay}`,
            );
    },
});
