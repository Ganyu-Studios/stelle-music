import { createEvent } from "seyfert";
import { playerListener } from "#stelle/listeners";

export default createEvent({
    data: { name: "voiceStateUpdate" },
    async run([newState, oldState], client): Promise<void> {
        await playerListener(client, newState, oldState);
    },
});
