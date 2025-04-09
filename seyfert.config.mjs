//@ts-check

import { config } from "seyfert";
import { GatewayIntentBits } from "seyfert/lib/types";

import { Environment } from "#stelle/utils/data/configuration.js";
import { Constants } from "#stelle/utils/data/constants.js";

export default config.bot({
    token: Environment.Token,
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
        base: Constants.WorkingDirectory(),
        events: "events",
        commands: "commands",
        langs: "locales",
        lavalink: "lavalink",
    },
});
