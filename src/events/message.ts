import { createEvent } from "seyfert";
import { mentionListener } from "#stelle/utils/listeners/mentionListener.js";

export default createEvent({
    data: { name: "messageCreate" },
    async run(message, client): Promise<void> {
        await mentionListener(client, message);
    },
});
