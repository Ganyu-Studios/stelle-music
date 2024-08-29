import { createEvent } from "seyfert";
import { playerListener } from "#stelle/listeners";

export default createEvent({
    data: { name: "voiceStateUpdate" },
    run: async ([newState, oldState], client) => {
        await playerListener(client, newState, oldState);
    },
});
