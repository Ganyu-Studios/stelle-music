import type { StelleConfiguration, NonGlobalCommands } from "#stelle/types";

import { onBotPermissionsFail, onPermissionsFail, onOptionsError, onRunError } from "#stelle/utils/functions/overrides.js";
import { ApplicationCommandType, PresenceUpdateStatus, ActivityType } from "seyfert/lib/types/index.js";
import { THINK_MESSAGES, DEBUG_MODE } from "#stelle/data/Constants.js";
import { sendErrorReport } from "#stelle/utils/functions/errors.js";
import { customContext } from "#stelle/utils/functions/utils.js";
import { HandleCommand } from "seyfert/lib/commands/handle.js";
import { Configuration } from "#stelle/data/Configuration.js";
import { StelleMiddlewares } from "#stelle/middlwares";
import { getWatermark } from "#stelle/utils/Logger.js";
import { LimitedCollection, Client } from "seyfert";
import { Yuna } from "yunaforseyfert";

import { StelleDatabase } from "./modules/Database.js";
import { StelleManager } from "./modules/Manager.js";

/**
 * Main Stelle class.
 */
export class Stelle extends Client<true> {
    /**
     * Stelle cooldowns collection.
     */
    public readonly cooldowns = new LimitedCollection<string, number>();

    /**
     * Stelle configuration.
     */
    public readonly config: StelleConfiguration = Configuration;

    /**
     * Stelle database instance.
     */
    public readonly database: StelleDatabase;

    /**
     * Stelle manager instance.
     */
    public readonly manager: StelleManager;

    /**
     * The timestamp when Stelle is ready.
     */
    public readyTimestamp = 0;

    /**
     * Create a new Stelle instance.
     */
    constructor() {
        super({
            context: customContext,
            globalMiddlewares: ["checkCooldown", "checkVerifications"],
            allowedMentions: {
                replied_user: false,
                parse: ["roles"]
            },
            components: {
                defaults: {
                    onRunError
                }
            },
            commands: {
                reply: () => true,
                prefix: async (message) => {
                    const guildPrefix = await this.database.getPrefix(message.guildId!);
                    return [guildPrefix, this.config.defaultPrefix, ...this.config.prefixes];
                },
                defaults: {
                    onBotPermissionsFail,
                    onOptionsError,
                    onPermissionsFail,
                    onRunError
                },
                deferReplyResponse: ({ client }) => ({
                    content: `<a:typing:1214253750093488149> **${client.me.username}** ${THINK_MESSAGES[Math.floor(Math.random() * THINK_MESSAGES.length)]
                        }`
                })
            },
            presence: () => ({
                afk: false,
                since: Date.now(),
                status: PresenceUpdateStatus.Idle,
                activities: [{
                    name: "Traveling... 🌠",
                    type: ActivityType.Playing
                }]
            })
        });

        this.manager = new StelleManager(this);
        this.database = new StelleDatabase(this);

        void this.run();
    }

    /**
     *
     * Reload Stelle..
     * @returns
     */
    public async reload(): Promise<void> {
        this.logger.warn("Attemping to reload...");

        try {
            await this.events.reloadAll();
            await this.commands.reloadAll();
            await this.components.reloadAll();
            await this.langs.reloadAll();
            await this.manager.handler.reloadAll();

            await this.uploadCommands({ cachePath: this.config.cache.filename });

            this.logger.info("Stelle has been reloaded.");
        } catch (error) {
            this.logger.error("Error -", error);
            throw error;
        }
    }

    /**
     *
     * Start the main Stelle process.
     * @returns
     */
    private async run(): Promise<"🌟"> {
        getWatermark();

        this.commands.onCommand = (file) => {
            const command = new file();

            if (command.type === ApplicationCommandType.PrimaryEntryPoint) {
                return command;
            }
            if (command.onlyDeveloper) {
                (command as NonGlobalCommands).guildId = this.config.guildIds;
            }

            return command;
        };

        this.events.onFail = (_, error) => sendErrorReport({ error });

        this.setServices({
            middlewares: StelleMiddlewares,
            cache: {
                disabledCache: {
                    bans: true,
                    emojis: true,
                    stickers: true,
                    roles: true,
                    presences: true,
                    messages: true,
                    stageInstances: true
                }
            },
            handleCommand: class extends HandleCommand {
                override argsParser = Yuna.parser({
                    logResult: DEBUG_MODE,
                    syntax: {
                        namedOptions: ["-", "--"]
                    }
                });

                override resolveCommandFromContent = Yuna.resolver({
                    client: this.client,
                    logResult: DEBUG_MODE
                });
            },
            langs: {
                default: this.config.defaultLocale,
                aliases: {
                    "es-419": ["es-ES"]
                }
            }
        });

        await this.start();
        await this.manager.load();

        return "🌟";
    }
}
