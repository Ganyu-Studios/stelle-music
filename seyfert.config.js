//@ts-check

import { GatewayIntentBits } from "seyfert/lib/types/index.js";
import { config } from "seyfert";

import { DEV_MODE, DEBUG_MODE } from "#stelle/data/Constants.js";

const base = DEV_MODE ? "src" : "dist";

export default config.bot({
    token: process.env.TOKEN ?? "Trailblazer",
    debug: DEBUG_MODE,
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
        lavalink: "lavalink",
        commands: "commands",
        components: "components",
        events: "events",
        langs: "locales",
    },
});