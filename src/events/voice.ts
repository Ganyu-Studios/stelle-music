import { createEvent } from "seyfert";
import { playerListener } from "#stelle/utils/functions/playerListener.js";

export default createEvent({
    data: { name: "voiceStateUpdate" },
    run: async ([newState, oldState], client) => {
        await playerListener(newState, client, oldState);
    },
});
