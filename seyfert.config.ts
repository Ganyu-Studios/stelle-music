import { config } from "seyfert";
import { GatewayIntentBits } from "seyfert/lib/types/index.js";
import { Environment } from "#stelle/utils/data/configuration.js";
import { StelleMeta } from "#stelle/utils/data/constants.js";

export default config.bot({
    token: Environment.TOKEN ?? "Ganyu on top!",
    debug: StelleMeta.Debug,
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
    ],
    locations: {
        base: "src",
        lavalink: "lavalink",
        config: "config",
        events: "events",
        commands: "commands",
        langs: "locales",
        components: "components",
    },
});
