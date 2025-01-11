import type { ParseMiddlewares, ParseLocales, ParseClient } from "seyfert";
import type { customContext } from "#stelle/utils/functions/utils.js";
import type { StelleMiddlewares } from "#stelle/middlwares";
import type { Stelle } from "#stelle/client";
import type { Options } from "#stelle/types";

import type defaultLocale from "./locales/en-US.js";

declare module "seyfert" {
    interface InternalOptions {
        withPrefix: true;
    }

    interface ExtendedRCLocations {
        lavalink: string;
    }

    interface Command extends Options { }
    interface SubCommand extends Options { }
    interface ComponentCommand extends Options { }
    interface ModalCommand extends Options { }
    interface ContextMenuCommand extends Options { }
    interface EntryPointCommand extends Options { }

    interface UsingClient extends ParseClient<Stelle> { }
    interface RegisteredMiddlewares extends ParseMiddlewares<typeof StelleMiddlewares> { }
    interface GlobalMetadata extends ParseMiddlewares<typeof StelleMiddlewares> { }
    interface DefaultLocale extends ParseLocales<typeof defaultLocale> { }
    interface ExtendContext extends ReturnType<typeof customContext> { }
}
