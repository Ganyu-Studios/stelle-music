//@ts-check

import { GatewayIntentBits } from "discord-api-types/v10";
import { config } from "seyfert";

import { DEBUG_MODE } from "#stelle/data/Constants.js";
import { InvalidEnvironment } from "#stelle/errors";

if (!process.env.TOKEN) throw new InvalidEnvironment("'TOKEN' in '.env' file cannot be empty or undefined.");

export default config.bot({
    token: process.env.TOKEN,
    debug: DEBUG_MODE,
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences,
    ],
    locations: {
        base: "src",
        output: "dist",
        commands: "commands",
        events: "events"
    },
});