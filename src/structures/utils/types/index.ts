export { StelleConfiguration } from "./client/StelleConfiguration.js";

export interface Options {
    /** The command cooldown. */
    cooldown?: number;
    /** Only the bot developer can use the command. */
    onlyDeveloper?: boolean;
    /** Only the guild owner cam use the command. */
    onlyGuildOwner?: boolean;
    /** Only a member in a voice channel can use the command. */
    inVoice?: boolean;
    /** Only a member on the same voice channel with Stelle will be able to use the command. */
    sameVoice?: boolean;
}
