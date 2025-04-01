//@ts-check

import { config } from "seyfert";
import { GatewayIntentBits } from "seyfert/lib/types";

import { Environment } from "#stelle/utils/data/configuration.js";

export default config.bot({
    token: Environment.Token,
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
    ],
    locations: {
        base: "src",
        events: "events",
    },
});
