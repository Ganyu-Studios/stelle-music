import { playerListener } from "#stelle/listeners";
import { createEvent } from "seyfert";

export default createEvent({
    data: { name: "voiceStateUpdate" },
    run: async ([newState, oldState], client) => {
        await playerListener(client, newState, oldState);
    }
});
