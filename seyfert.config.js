//@ts-check

import { GatewayIntentBits } from "discord-api-types/v10";
import { DEBUG_MODE } from "./dist/structures/utils/data/Constants.js";
import { config } from "seyfert";

process.loadEnvFile();

if (!process.env.TOKEN) throw new Error("Stelle [ENV]: 'TOKEN' in '.env' file cannot be empty or undefined.");

export default config.bot({
    debug: DEBUG_MODE,
    token: process.env.TOKEN ?? "",
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
        //commands: "commands",
        //events: "events"
    },
});