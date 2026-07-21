import type { TrackRequester, TrackStructure } from "hoshimi";
import { type DefaultLocale, User } from "seyfert";
import { TimeFormat } from "../time.js";
import { omitKeys } from "../utils.js";

/**
 *
 * Transform the requester user into a simple object.
 * @param {unknown} requester The requester user.
 * @returns {StelleUser} The transformed user.
 */
export const requesterFn = <T = TrackRequester>(requester: TrackRequester): T => {
    if (requester instanceof User)
        return {
            ...omitKeys(requester as User & Record<string, unknown>, [
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
};

/**
 * Format the track time for display, showing "Live" for streams and a dotted time format for regular tracks.
 * @param {TrackStructure} track The track to format the time for.
 * @param {DefaultLocale} messages The locale object for localized messages.
 * @returns {string} The formatted time string.
 */
export const formatDuration = (track: TrackStructure, messages: DefaultLocale["messages"]): string =>
    track.info.isStream ? messages.commands.play.live : (TimeFormat.toDotted(track.info.length) ?? messages.commands.play.undetermined);
