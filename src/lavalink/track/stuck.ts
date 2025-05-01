import { LavalinkEventTypes } from "#stelle/types";
import { createLavalinkEvent } from "#stelle/utils/manager/events.js";

// i'm blind testing, i don't know how to test this
// cuz this event is fired *rarely*
export default createLavalinkEvent({
    name: "trackStuck",
    type: LavalinkEventTypes.Manager,
    async run(client, player): Promise<void> {
        if (!player.textChannelId) return;

        await player.skip(undefined, false);

        const messageId = player.get<string | undefined>("messageId");
        if (messageId) await client.messages.edit(messageId, player.textChannelId, { components: [] }).catch(() => null);
    },
});
