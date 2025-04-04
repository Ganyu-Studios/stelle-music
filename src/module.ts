import type { ParseClient, ParseLocales } from "seyfert";
import type { Stelle } from "#stelle/classes/Stelle.js";
import type { StelleContext } from "#stelle/utils/functions/utils.js";
import type English from "./locales/en-US.js";

declare module "seyfert" {
    interface UsingClient extends ParseClient<Stelle> {}
    interface ExtendContext extends ReturnType<typeof StelleContext> {}
    interface DefaultLocale extends ParseLocales<typeof English> {}

    interface InternalOptions {
        withPrefix: true;
    }

    interface ExtendedRCLocations {
        lavalink: string;
    }
}
