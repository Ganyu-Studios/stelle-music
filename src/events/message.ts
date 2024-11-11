import { createEvent } from "seyfert";
import { mentionListener } from "#stelle/listeners";

export default createEvent({
    data: { name: "messageCreate" },
    run: async (message, client) => {
        await mentionListener(client, message);
    },
});
