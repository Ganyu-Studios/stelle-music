import type { ChannelDeletePacket, VoicePacket, VoiceServer, VoiceState } from "lavalink-client";

import { createEvent } from "seyfert";

type AnyPacket = ChannelDeletePacket | VoicePacket | VoiceServer | VoiceState;

export default createEvent({
    data: { name: "raw" },
    run: (data, client) => client.manager.sendRawData(data as AnyPacket)
});
