import { createPlugin, definePlugins, EntryPointCommand } from "seyfert";
import type { HandleableCommandInstance } from "seyfert/lib/commands/handler.js";
import { Yuna } from "yunaforseyfert";
import { Configuration } from "#stelle/utils/data/configuration.js";
import { StelleMeta } from "#stelle/utils/data/constants.js";
import { logger } from "#stelle/utils/functions/internal/logger.js";

/**
 * The seyfert funky plugin for developer commands.
 */
const developerCommands = createPlugin({
    name: "developer-commands",
    register(api): void {
        api.handlers.transform(
            (command): HandleableCommandInstance | void | false => {
                if (!(command instanceof EntryPointCommand)) {
                    if (command.onlyDeveloper) command.guildId = Configuration.guildIds;

                    if (command.skipRegister) {
                        logger.info(`[Command] Skipped command registration | name: ${command.name}`);
                        return false;
                    }
                }
            },
            { kinds: ["command"] },
        );
    },
});

/**
 * The Yuna parser plugin.
 */
const yunaParser = Yuna.plugin({
    parser: {
        logResult: StelleMeta.Debug,
        syntax: {
            namedOptions: ["-", "--"],
        },
    },
    resolver: {
        logResult: StelleMeta.Debug,
        afterPrepare(metadata): void {
            if (StelleMeta.Debug) this.logger.debug(`[Client] Commands prepared | count: ${metadata.commands.length}`);
        },
    },
});

/**
 * Seyfert funky plugins.
 */
export const plugins = definePlugins(developerCommands, yunaParser);

/**
 * The seyfert funky plugin definition type.
 */
export type PluginsDefinition = typeof plugins;
