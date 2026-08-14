import { DestroyReasons, EventNames } from "hoshimi";
import { type AllChannels, LogLevels, type UsingClient } from "seyfert";
import type { SessionJson } from "#stelle/types";
import { PanelOps } from "#stelle/utils/functions/manager/panel.js";
import { PlayerOps } from "#stelle/utils/functions/manager/player.js";
import { createLavalinkEvent } from "#stelle/utils/manager/events.js";
import { Sessions } from "#stelle/utils/manager/sessions.js";

/**
 *
 * Recreate a 24/7 player from its persisted session and rejoin its voice channel. Used when the bot is kicked out
 * of voice while 24/7 is enabled: instead of tearing down, it comes back. Mirrors `resumeListener`'s restore, but
 * connects fresh (the old voice state is gone) rather than patching a live one.
 * @param {UsingClient} client The client instance.
 * @param {SessionJson} session The persisted session to restore from.
 * @returns {Promise<void>} A promise that resolves once the player is reconnected.
 */
async function reconnect(client: UsingClient, session: SessionJson): Promise<void> {
    const player = client.manager.createPlayer({ ...session.options });

    await player.connect();

    if (session.messageId) await player.data.set("messageId", session.messageId);
    if (session.enabledAutoplay) await player.data.set("enabledAutoplay", session.enabledAutoplay);
    if (session.me) await player.data.set("me", session.me);
    if (session.localeString) await player.data.set("localeString", session.localeString);
    if (session.lyricsId) await player.data.set("lyricsId", session.lyricsId);
    if (session.lyricsEnabled) await player.data.set("lyricsEnabled", session.lyricsEnabled);
    if (session.is247) await player.data.set("is247", session.is247);
    if (session.isAutoPause) await player.data.set("isAutoPause", session.isAutoPause);
    if (session.isRequestChannel) await player.data.set("isRequestChannel", session.isRequestChannel);

    client.debug(LogLevels.Info, `[Lavalink] 24/7 autoreconnect | guild: ${session.guildId} | voice: ${session.options.voiceId}`);
}

export default createLavalinkEvent({
    name: EventNames.PlayerDestroy,
    async run(client, player, reason): Promise<void> {
        // 24/7 autoreconnect: a forced voice disconnect (kick / channel deleted / moved out) destroys the player with
        // `VoiceChannelLeft`. When 24/7 is on, recreate it from the session and rejoin instead of tearing down. is247
        // comes from the session because `player.data` is already cleared by the time this fires.
        const session: SessionJson | undefined = Sessions.get<SessionJson>(player.guildId);
        const is247: boolean = session?.is247 ?? client.config.twentyfourseven.is247;

        if (
            session &&
            is247 &&
            reason === DestroyReasons.VoiceChannelLeft &&
            client.config.twentyfourseven.autoReconnect &&
            client.config.sessions.enabled
        ) {
            await reconnect(client, session);
            return;
        }

        Sessions.delete(player.guildId);

        const textId: string | undefined = player.textId ?? player.options.textId;
        if (!textId) return;

        const voiceId: string | undefined = player.voiceId ?? player.options.voiceId;
        if (!voiceId) return;

        const voice: AllChannels = await client.channels.fetch(voiceId);
        if (voice.isVoice()) await voice.setVoiceStatus(null).catch((): null => null);

        if (await player.data.get("isRequestChannel")) await PanelOps.reset(client, player.guildId);

        const messageId: string | undefined = await player.data.get("messageId");
        if (messageId) await client.messages.edit(messageId, textId, { components: [] }).catch((): null => null);

        await PlayerOps.lyrics(client, player, textId, { clearEnabled: true });

        client.debug(LogLevels.Debug, `[Lavalink] Player destroyed | guild: ${player.guildId} | voice: ${voiceId} | text: ${textId}`);
    },
});
