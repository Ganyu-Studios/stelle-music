import type { UsingClient } from "seyfert";
import { PresenceUpdateStatus } from "seyfert/lib/types/index.js";

import { BOT_ACTIVITIES } from "#stelle/data/Constants.js";
import { ms } from "#stelle/utils/TimeFormat.js";

/**
 *
 * Change Stelle presence.
 * @param client The client.
 */
export function changePresence(client: UsingClient): void {
    let activity = 0;

    setInterval(() => {
        if (activity === BOT_ACTIVITIES.length) activity = 0;

        const guilds = client.cache.guilds!.count();
        const users = client.cache.users!.count();
        const players = client.manager.players.size;

        const randomActivity = BOT_ACTIVITIES[activity++ % BOT_ACTIVITIES.length];

        client.gateway.setPresence({
            afk: false,
            since: Date.now(),
            status: PresenceUpdateStatus.Online,
            activities: [
                {
                    ...randomActivity,
                    name: randomActivity.name
                        .replaceAll("{guilds}", `${guilds}`)
                        .replaceAll("{users}", `${users}`)
                        .replaceAll("{players}", `${players}`),
                },
            ],
        });
    }, ms("35s"));

    client.gateway.setPresence({
        activities: [BOT_ACTIVITIES[0]],
        afk: false,
        since: Date.now(),
        status: PresenceUpdateStatus.Online,
    });
}
