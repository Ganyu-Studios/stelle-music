import { PresenceUpdateStatus } from "discord-api-types/v10";
import type { UsingClient } from "seyfert";

import { BOT_ACTIVITIES } from "#stelle/data/Constants.js";

import ms from "ms";

/**
 *
 * Change Stelle presence.
 * @param client
 */
export async function changePresence(client: UsingClient): Promise<void> {
    let activity = 0;

    setInterval(async () => {
        if (activity === BOT_ACTIVITIES.length) activity = 0;

        const guilds = await client.cache.guilds!.count();
        const users = await client.cache.users!.count();
        const players = client.manager.players.size;

        const randomActivity = BOT_ACTIVITIES[activity++ % BOT_ACTIVITIES.length];

        await client.gateway.setPresence({
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

    await client.gateway.setPresence({
        activities: [BOT_ACTIVITIES[0]],
        afk: false,
        since: Date.now(),
        status: PresenceUpdateStatus.Online,
    });
}
