//@ts-check

import { GatewayIntentBits } from "discord-api-types/v10";
import { config } from "seyfert";

import { DEBUG_MODE } from "#stelle/data/Constants.js";

export default config.bot({
    token: process.env.TOKEN ?? "Trailblazer",
    debug: DEBUG_MODE,
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessages,
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