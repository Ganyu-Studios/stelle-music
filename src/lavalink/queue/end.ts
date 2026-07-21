import { EventNames } from "hoshimi";
import { type AllChannels, Embed } from "seyfert";
import { StelleMeta } from "#stelle/utils/data/constants.js";
import { createLavalinkEvent } from "#stelle/utils/manager/events.js";

export default createLavalinkEvent({
    name: EventNames.QueueEnd,
    async run(client, player): Promise<void> {
        if (!(player.textId && player.voiceId)) return;

        // only unsubscribe if the queue is ended.
        const lyricsId: string | undefined = await player.data.get("lyricsId");
        if (lyricsId) {
            await client.messages.delete(lyricsId, player.textId).catch((): null => null);

            const isEnabled = !!(await player.data.get("lyricsEnabled"));
            if (isEnabled) await player.lyrics.unsubscribe();

            await player.data.delete("lyricsId");
            await player.data.delete("lyrics");
            await player.data.delete("lyricsEnabled");
        }

        const messageId: string | undefined = await player.data.get("messageId");
        if (messageId) {
            if (client.config.deleter.onTrackEnd) await client.messages.delete(messageId, player.textId).catch((): null => null);
            else await client.messages.edit(messageId, player.textId, { components: [] }).catch((): null => null);
        }

        const locale: string | undefined = await player.data.get("localeString");
        if (!locale) return;

        const voice: AllChannels = await client.channels.fetch(player.voiceId);
        if (!voice.is(["GuildStageVoice", "GuildVoice"])) return;

        const { messages } = client.t(locale).get();

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
