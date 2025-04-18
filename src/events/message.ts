import { createEvent } from "seyfert";
import { mentionListener } from "#stelle/utils/listeners/message/mentionListener.js";
import { requestListener } from "#stelle/utils/listeners/message/requestListener.js";

export default createEvent({
    data: { name: "messageCreate" },
    async run(message, client): Promise<void> {
        await mentionListener(client, message);
        await requestListener(client, message);
    },
});
