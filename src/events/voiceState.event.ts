import { createEvent } from "seyfert";
import { playerListener } from "#stelle/utils/listeners/player/playerListener.js";

export default createEvent({
    data: { name: "voiceStateUpdate" },
    async run([newState, oldState], client): Promise<void> {
        await playerListener(client, newState, oldState);
    },
});
