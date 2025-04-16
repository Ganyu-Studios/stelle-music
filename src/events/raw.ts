import type { ChannelDeletePacket, VoicePacket, VoiceServer, VoiceState } from "lavalink-client";
import { createEvent } from "seyfert";

/**
 * Type of packets received from discord.
 */
type AnyPacket = VoicePacket | VoiceServer | VoiceState | ChannelDeletePacket;

export default createEvent({
    data: { name: "raw" },
    async run(payload, client): Promise<void> {
        await client.manager.sendRawData(payload as AnyPacket);
    },
});
