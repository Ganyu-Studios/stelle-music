// @ts-check

import { config } from "seyfert";
import { GatewayIntentBits } from "seyfert/lib/types/index.js";

import { Environment } from "#stelle/utils/data/configuration.js";
import { Constants } from "#stelle/utils/data/constants.js";

/**
 * @typedef StelleLocations
 * @property {string} lavalink
 * @property {string} config
 */

// get the base directory for the bot
// more funny.
const base = Constants.WorkingDirectory();

export default config.bot({
    token: Environment.Token ?? "Ganyu on top!",
    debug: Constants.Debug,
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
    ],
    /**
     * @type {import("seyfert").RuntimeConfig["locations"] & StelleLocations}
     */
    locations: {
        base,
        lavalink: "lavalink",
        config: "config",
        events: "events",
        commands: "commands",
        langs: "locales",
        components: "components",
    },
});
