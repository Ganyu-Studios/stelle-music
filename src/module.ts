import type { LyricsResult } from "hoshimi";
import type { ParseClient, ParseLocales, ParseMiddlewares } from "seyfert";
import type { Stelle } from "#stelle/classes/Stelle.js";
import type { Options, TrackUser } from "#stelle/types";
import type { StelleContext } from "#stelle/utils/functions/utils.js";
import type English from "./locales/en-US.js";
import type { GlobalMiddlewares, StelleMiddlewares } from "./middlewares/index.js";

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
        config: string;
    }
}

declare module "hoshimi" {
    interface CustomizableTrack {
        requester: TrackUser;
    }

    interface CustomizablePlayerStorage {
        localeString: string;
        me: TrackUser;
        lyrics: LyricsResult;
        lyricsEnabled: boolean;
        lyricsId: string;
        enabledAutoplay: boolean;
        is247: boolean;
        isAutoPause: boolean;
        messageId: string;
    }
}
