import { Kazagumo } from "kazagumo";
import { Connectors } from "shoukaku";

import type { UsingClient } from "seyfert";

import Spotify from "kazagumo-spotify";

export class StelleManager extends Kazagumo {
    constructor(client: UsingClient) {
        super(
            {
                defaultSearchEngine: "youtube",
                defaultYoutubeThumbnail: "maxresdefault",
                send: (guildId, payload) => client.gateway.send(client.gateway.calculateShardId(guildId), payload),
                plugins: [new Spotify(client.config.spotify)],
            },
            new Connectors.Seyfert(client),
            client.config.nodes,
        );
    }
}
