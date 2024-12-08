import type { ChannelDeletePacket, VoicePacket, VoiceServer, VoiceState } from "lavalink-client";
import { createEvent } from "seyfert";

type AnyPacket = VoicePacket | VoiceServer | VoiceState | ChannelDeletePacket;

export default createEvent({
    data: { name: "raw" },
    run: (data, client) => {
        // Because the player don't save the voice payload, so we need to save using
        // this piece of garbage code.
        if (client.config.sessions.resumePlayers) {
            if (["VOICE_SERVER_UPDATE", "VOICE_STATE_UPDATE"].includes(data.t)) {
                const payload = data.d as VoiceServer | VoiceState;

                const player = client.manager.getPlayer(payload.guild_id);
                if (!player) return;

                const sessionId = player.voice.sessionId ?? ("sessionId" in payload ? payload.sessionId : null);

                if ("token" in payload) {
                    player.voice = {
                        sessionId,
                        endpoint: payload.endpoint,
                        token: payload.token,
                    };
                }
            }
        }

        return client.manager.sendRawData(data as AnyPacket);
    },
});
