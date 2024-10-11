//@ts-check

import { GatewayIntentBits } from "seyfert/lib/types/index.js";
import { config } from "seyfert";

import { DEBUG_MODE, IS_WINDOWS } from "#stelle/data/Constants.js";

const output = DEBUG_MODE && IS_WINDOWS ? "src" : "dist";

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
    /**
     * @type {import("seyfert").RuntimeConfig["locations"] & { lavalink: string }}
     */
    locations: {
        output,
        base: "src",
        lavalink: "lavalink",
        commands: "commands",
        components: "components",
        events: "events",
        langs: "locales",
    },
});