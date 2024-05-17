//@ts-check

import { GatewayIntentBits } from "discord-api-types/v10";
import { config } from "seyfert";

process.loadEnvFile();

if (!process.env.TOKEN) throw new Error("Stelle [ENV]: 'TOKEN' in '.env' file cannot be empty or undefined.")

export default config.bot({
    token: process.env.TOKEN,
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
    ],
    locations: {
        base: "src",
        output: "dist",
    },
});