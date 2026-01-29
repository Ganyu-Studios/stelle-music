import type { Guild, UsingClient } from "seyfert";
import { type GatewayActivityUpdateData, PresenceUpdateStatus } from "seyfert/lib/types/index.js";

import { Constants } from "#stelle/utils/data/constants.js";

/**
 *
 * Change the presence of the client.
 * @param {UsingClient} client - The client instance.
 * @returns {void} - Nothing? Yes, nothing.
 */
export function changePresence(client: UsingClient): void {
    let index: number = 0;

    const array: GatewayActivityUpdateData[] = Constants.Activities();

    setInterval((): void => {
        if (index >= array.length) index = 0;

        const guilds: Guild<"cached">[] = client.cache.guilds?.values() ?? [];
        const users: number = guilds.reduce((a, b) => a + (b.memberCount ?? 0), 0);
        const players: number = client.manager.players.size;

        const activities: GatewayActivityUpdateData[] = Constants.Activities({ users, players, guilds: guilds.length });
        const activity: GatewayActivityUpdateData = activities[index++ % array.length];

        client.gateway.setPresence({
            status: PresenceUpdateStatus.Online,
            activities: [activity],
            afk: false,
            since: Date.now(),
        });
    }, client.config.presenceInterval);

    client.gateway.setPresence({
        status: PresenceUpdateStatus.Online,
        activities: [array[index]],
        afk: false,
        since: Date.now(),
    });
}
