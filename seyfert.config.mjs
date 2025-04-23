// @ts-check

import { config } from "seyfert";
import { GatewayIntentBits } from "seyfert/lib/types/index.js";

import { Environment } from "#stelle/utils/data/configuration.js";
import { Constants } from "#stelle/utils/data/constants.js";

// get the base directory for the bot
// more funny.
const base = Constants.WorkingDirectory(Constants.Dev);

export default config.bot({
    token: Environment.Token ?? "Ganyu on top!",
    debug: Constants.Debug,
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
    ],
    /**
     * @type {import("seyfert").RuntimeConfig["locations"] & { lavalink: string }}
     */
    locations: {
        base,
        events: "events",
        commands: "commands",
        langs: "locales",
        lavalink: "lavalink",
        components: "components",
    },
});
