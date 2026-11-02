import { createEvent } from "seyfert";
import { mentionListener } from "#stelle/utils/listeners/message/mentionListener.js";
import { quizListener } from "#stelle/utils/listeners/message/quizListener.js";
import { requestListener } from "#stelle/utils/listeners/message/requestListener.js";

export default createEvent({
    data: { name: "messageCreate" },
    async run(message, client): Promise<void> {
        // The request channel consumes (and deletes) its own messages; skip the mention listener when it handled one.
        if (await requestListener(client, message)) return;

        // A running quiz consumes guesses in its channel; skip the mention listener when it handled one.
        if (await quizListener(client, message)) return;

        await mentionListener(client, message);
    },
});
