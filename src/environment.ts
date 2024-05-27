import type { ParseClient, ParseLocales, ParseMiddlewares } from "seyfert";
import type { Stelle } from "#stelle/client";
import type { KazagumoEvents, Options, ShoukakuEvents } from "#stelle/types";
import type { StelleMiddlewares } from "#stelle/middlwares";

import { customContext } from "#stelle/utils/functions/utils.js";

import defaultLocale from "./locales/en-US.js";

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            TOKEN: string;
            SPOTIFY_ID: string;
            SPOTIFY_SECRET: string;
        }
    }
}

declare module "seyfert" {
    interface InternalOptions {
        withPrefix: true;
    }

    interface Command extends Options { }
    interface SubCommand extends Options { }
    interface ComponentCommand extends Options { }
    interface ModalCommand extends Options { }
    interface ContextMenuCommand extends Options { }

    interface UsingClient extends ParseClient<Stelle> { }
    interface RegisteredMiddlewares extends ParseMiddlewares<typeof StelleMiddlewares> { }
    interface GlobalMetadata extends ParseMiddlewares<typeof StelleMiddlewares> { }
    interface DefaultLocale extends ParseLocales<typeof defaultLocale> { }
    interface ExtendContext extends ReturnType<typeof customContext> { }
}

//cuz shoukaku & kazagumo types are strage...
declare module "shoukaku" {
    interface Shoukaku {
        on<U extends keyof ShoukakuEvents>(event: U, listener: (...args: ShoukakuEvents[U]) => void): this;
        once<U extends keyof ShoukakuEvents>(event: U, listener: (...args: ShoukakuEvents[U]) => void): this;
        off<U extends keyof ShoukakuEvents>(event: U, listener: (...args: ShoukakuEvents[U]) => void): this;
    }
}

declare module "kazagumo" {
    interface Kazagumo {
        on<U extends keyof KazagumoEvents>(event: U, listener: (...args: KazagumoEvents[U]) => void): this;
        once<U extends keyof KazagumoEvents>(event: U, listener: (...args: KazagumoEvents[U]) => void): this;
        off<U extends keyof KazagumoEvents>(event: U, listener: (...args: KazagumoEvents[U]) => void): this;
    }
}