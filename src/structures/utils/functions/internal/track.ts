import type { TrackRequester, TrackStructure } from "hoshimi";
import { type DefaultLocale, User } from "seyfert";
import { TimeFormat } from "./time.js";
import { UtilsOps } from "./utils.js";

export const TrackOps = {
    /**
     *
     * Return the requester object for the track, omitting sensitive information if the requester is a user.
     * @template T The type of the requester object.
     * @param {TrackRequester} requester The requester of the track.
     * @returns {T} The requester object with sensitive information omitted if the requester is a user.
     */
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
    /**
     *
     * Return the duration of the track as a string, formatted according to the locale's messages.
     * @param {TrackStructure} track The track structure.
     * @param {DefaultLocale["messages"]} messages The messages for the locale.
     * @returns {string} The duration of the track as a string.
     */
    duration(track: TrackStructure, messages: DefaultLocale["messages"]): string {
        return track.info.isStream
            ? messages.commands.play.live
            : (TimeFormat.toDotted(track.info.length) ?? messages.commands.play.undetermined);
    },
};
