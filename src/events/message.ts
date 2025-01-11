import { mentionListener } from "#stelle/listeners";
import { createEvent } from "seyfert";

export default createEvent({
    data: { name: "messageCreate" },
    run: async (message, client) => {
        await mentionListener(client, message);
    }
});
