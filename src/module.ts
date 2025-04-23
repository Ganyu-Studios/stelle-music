import type { ParseClient, ParseLocales, ParseMiddlewares } from "seyfert";
import type { Stelle } from "#stelle/classes/Stelle.js";
import type { Options } from "#stelle/types";
import type { StelleContext } from "#stelle/utils/functions/utils.js";
import type { GlobalMiddlewares, StelleMiddlewares } from "./middlewares/index.js";

import type English from "./locales/en-US.js";

declare module "seyfert" {
    interface UsingClient extends ParseClient<Stelle> {}
    interface ExtendContext extends ReturnType<typeof StelleContext> {}
    interface DefaultLocale extends ParseLocales<typeof English> {}
    interface RegisteredMiddlewares extends ParseMiddlewares<typeof StelleMiddlewares> {}
    interface GlobalMetadata extends ParseMiddlewares<typeof GlobalMiddlewares> {}

    interface Command extends Options {}
    interface SubCommand extends Options {}
    interface ComponentCommand extends Options {}
    interface ModalCommand extends Options {}
    interface ContextMenuCommand extends Options {}
    interface EntryPointCommand extends Options {}

    interface InternalOptions {
        withPrefix: true;
    }

    interface ExtendedRCLocations {
        lavalink: string;
    }
}
