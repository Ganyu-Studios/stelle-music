import type { TrackRequester, TrackStructure } from "hoshimi";
import { type DefaultLocale, User } from "seyfert";
import { TimeFormat } from "./time.js";
import { UtilsOps } from "./utils.js";

export const TrackOps = {
    requesterFn<T = TrackRequester>(requester: TrackRequester): T {
        if (requester instanceof User)
            return {
                ...UtilsOps.omit(requester as User & Record<string, unknown>, [
                    "client",
                    "avatarDecorationData",
                    "banner",
                    "createdAt",
                    "discriminator",
                    "flags",
                    "publicFlags",
                    "accentColor",
                    "system",
                    "verified",
                    "email",
                    "mfaEnabled",
                    "primaryGuild",
                    "premiumType",
                    "locale",
                    "name",
                    "createdTimestamp",
                    "globalName",
                    "avatar",
                    "displayNameStyles",
                    "collectibles",
                    "clan",
                    "bot",
                    "application",
                    "bannerColor",
                    "bio",
                ]),
                tag: requester.bot ? requester.username : requester.tag,
            } as T;

        return requester as T;
    },

    duration(track: TrackStructure, messages: DefaultLocale["messages"]): string {
        return track.info.isStream
            ? messages.commands.play.live
            : (TimeFormat.toDotted(track.info.length) ?? messages.commands.play.undetermined);
    },
};
