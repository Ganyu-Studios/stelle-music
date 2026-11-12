import { config, type RuntimeConfig } from "seyfert";
import { GatewayIntentBits } from "seyfert/lib/types/index.js";
import { Environment } from "#stelle/utils/data/configuration.js";
import { StelleMeta } from "#stelle/utils/data/constants.js";

/**
 * Stelle's own folders, loaded on top of Seyfert's.
 */
interface StelleLocations {
    lavalink: string;
    config: string;
}

/**
 * The folders to load. Bun runs the TypeScript sources directly, so the base is always `src`.
 * @type {RuntimeConfig["locations"] & StelleLocations}
 */
const locations: RuntimeConfig["locations"] & StelleLocations = {
    base: "src",
    lavalink: "lavalink",
    config: "config",
    events: "events",
    commands: "commands",
    langs: "locales",
    components: "components",
};

export default config.bot({
    token: Environment.TOKEN ?? "Ganyu on top!",
    debug: StelleMeta.Debug,
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
    ],
    locations,
});
