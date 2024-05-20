import { Kazagumo } from "kazagumo";
import type { UsingClient } from "seyfert";
import { SeyfertConnector } from "#stelle/classes";

import Spotify from "kazagumo-spotify";

export class StelleManager extends Kazagumo {
    constructor(client: UsingClient) {
        super(
            {
                defaultSearchEngine: "spsearch",
                defaultYoutubeThumbnail: "maxresdefault",
                send: (guildId, payload) => client.gateway.send(client.gateway.calculateShardId(guildId), payload),
                plugins: [new Spotify({ ...client.config.spotify })],
            },
            new SeyfertConnector(client),
            client.config.nodes,
        );
    }
}
