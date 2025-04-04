import type { ParseClient } from "seyfert";
import type { Stelle } from "#stelle/classes/Stelle.js";

declare module "seyfert" {
    interface InternalOptions {
        withPrefix: true;
    }

    interface ExtendedRCLocations {
        lavalink: string;
    }

    interface UsingClient extends ParseClient<Stelle> {}
}
