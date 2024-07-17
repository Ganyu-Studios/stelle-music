import type { ChannelDeletePacket, VoicePacket, VoiceServer, VoiceState } from "lavalink-client";
import { createEvent } from "seyfert";

type AnyPacket = VoicePacket | VoiceServer | VoiceState | ChannelDeletePacket;

export default createEvent({
    data: { name: "raw" },
    run: async (data, client) => await client.manager.sendRawData(data as AnyPacket),
});
