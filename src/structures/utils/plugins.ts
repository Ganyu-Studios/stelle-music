import { createPlugin, definePlugins, EntryPointCommand } from "seyfert";
import type { HandleableCommandInstance } from "seyfert/lib/commands/handler.js";
import { Configuration } from "#stelle/utils/data/configuration.js";
import { logger } from "./functions/internal/logger.js";

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
 * Seyfert funky plugins.
 */
export const plugins = definePlugins(developerCommands);

/**
 * The seyfert funky plugin definition type.
 */
export type PluginsDefinition = typeof plugins;
