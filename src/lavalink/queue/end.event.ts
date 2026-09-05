import { EventNames } from "hoshimi";
import { Embed, LogLevels } from "seyfert";
import { PanelOps } from "#stelle/utils/functions/manager/panel.js";
import { PlayerOps } from "#stelle/utils/functions/manager/player.js";
import { createLavalinkEvent } from "#stelle/utils/manager/events.js";

export default createLavalinkEvent({
    name: EventNames.QueueEnd,
    async run(client, player): Promise<void> {
        if (!(player.textId && player.voiceId)) return;

        // In quiz mode the engine plays tracks directly and controls teardown; ignore natural queue-end between snippets.
        if (await player.data.get("isQuiz")) return;

        // only unsubscribe if the queue is ended.
        await PlayerOps.lyrics(client, player, player.textId, { unsubscribe: true, clearEnabled: true });
        await PlayerOps.nowPlaying(client, player, player.textId);

        const messages = await PlayerOps.messages(client, player);
        if (!messages) return;

        const voice = await PlayerOps.voice(client, player);
        if (!voice) return;

        if (voice.isVoice()) await voice.setVoiceStatus(messages.events.voiceStatus.queueEnd).catch((): null => null);

        if (await player.data.get("isRequestChannel")) {
            // Persistent panel: return it to idle instead of posting a one-off "queue ended" message.
            await PanelOps.reset(client, player.guildId);
        } else {
            const embed = new Embed().setDescription(messages.events.playerEnd).setColor(client.config.color.success).setTimestamp();

            await client.messages.write(player.textId, { embeds: [embed] }).catch((): null => null);
            await player.data.delete("messageId");
        }

        const autoplay: boolean = !!(await player.data.get("enabledAutoplay"));

        client.debug(
            LogLevels.Debug,
            `[Lavalink] Queue ended | guild: ${player.guildId} | remaining: ${player.queue.tracks.length} | autoplay: ${autoplay}`,
        );
    },
});
