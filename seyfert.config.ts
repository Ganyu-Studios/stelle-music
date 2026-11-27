import { config, GatewayIntentBits } from "seyfert";
import { Environment } from "#stelle/utils/data/configuration.js";
import { StelleMeta } from "#stelle/utils/data/constants.js";

export default config.bot({
    token: Environment.TOKEN,
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
