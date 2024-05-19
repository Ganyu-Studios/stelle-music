import { Kazagumo } from "kazagumo";
import type { UsingClient } from "seyfert";
import { SeyfertConnector } from "#stelle/classes";

import Spotify from "kazagumo-spotify";

export class StelleManager extends Kazagumo {
    constructor(client: UsingClient) {
        const { clientId, clientSecret, searchMarket, albumPageLimit, playlistPageLimit, searchLimit } = client.config.spotify;

        super(
            {
                defaultSearchEngine: "spsearch",
                defaultYoutubeThumbnail: "maxresdefault",
                send: (guildId, payload) => client.gateway.send(client.gateway.calculateShardId(guildId), payload),
                plugins: [
                    new Spotify({
                        clientId,
                        clientSecret,
                        searchMarket,
                        albumPageLimit,
                        playlistPageLimit,
                        searchLimit,
                    }),
                ],
            },
            new SeyfertConnector(client),
            client.config.nodes,
        );
    }
}
