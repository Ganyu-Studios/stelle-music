import { createEvent } from "seyfert";
import { mentionListener } from "#stelle/utils/listeners/message/mentionListener.js";

export default createEvent({
    data: { name: "messageCreate" },
    async run(message, client): Promise<void> {
        await mentionListener(client, message);
    },
});
