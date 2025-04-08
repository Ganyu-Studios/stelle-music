import { Client, LimitedCollection } from "seyfert";
import { HandleCommand } from "seyfert/lib/commands/handle.js";
import { ActivityType, ApplicationCommandType, type GatewayPresenceUpdateData, PresenceUpdateStatus } from "seyfert/lib/types/index.js";
import { Yuna } from "yunaforseyfert";

import type { NonGlobalCommands, StelleConfiguration } from "#stelle/types";

import { StelleMiddlewares } from "#stelle/middlewares";
import { Configuration } from "#stelle/utils/data/configuration.js";
import { Constants } from "#stelle/utils/data/constants.js";
import { StelleContext } from "#stelle/utils/functions/utils.js";

import { StelleDatabase } from "./Database.js";
import { StelleManager } from "./Manager.js";

/**
 * Class representing the main client of the bot.
 * @extends Client
 * @class Stelle
 */
export class Stelle extends Client<true> {
    /**
     * The client configuration.
     * @type {StelleConfiguration}
     * @readonly
     */
    readonly config: StelleConfiguration = Configuration;

    /**
     * The client cooldowns collection.
     * @type {LimitedCollection<string, number>}
     * @readonly
     */
    readonly cooldowns: LimitedCollection<string, number> = new LimitedCollection<string, number>();

    /**
     * The client database instance.
     * @type {StelleDatabase}
     */
    readonly database: StelleDatabase;

    /**
     * The client lavalink manager instance.
     * @type {StelleManager}
     */
    readonly manager: StelleManager;

    /**
     * The timestamp when the client is ready.
     * @type {number}
     * @default 0
     * @readonly
     */
    public readyTimestamp: number = 0;

    /**
     * Creates an instance of the Stelle client.
     */
    constructor() {
        super({
            context: StelleContext,
            globalMiddlewares: ["cooldownMiddleware"],
            allowedMentions: {
                replied_user: false,
                parse: ["roles", "users"],
            },
            presence: (): GatewayPresenceUpdateData => ({
                afk: false,
                since: Date.now(),
                status: PresenceUpdateStatus.Idle,
                activities: [{ name: "Traveling... 🌠", type: ActivityType.Playing }],
            }),
            commands: {
                reply: (): boolean => this.config.commands.reply,
                prefix: async ({ client, guildId }): Promise<string[]> => {
                    const prefixes: string[] = [...client.config.commands.prefixes, client.config.commands.defaultPrefix];

                    if (guildId) prefixes.push(await client.database.getPrefix(guildId));

                    return prefixes.map((prefix): string => prefix.toLowerCase());
                },
                deferReplyResponse: ({ client }) => ({
                    content: `<a:typing:1214253750093488149> **${client.me.username}** ${Constants.ThinkMessage()}`,
                }),
            },
        });

        this.database = new StelleDatabase(this);
        this.manager = new StelleManager(this);
    }

    /**
     * Start the main process of the client.
     * @returns {Promise<void>} A promise, yay!
     */
    public async run(): Promise<void> {
        this.commands.onCommand = (file) => {
            const command = new file();

            if (command.type === ApplicationCommandType.PrimaryEntryPoint) return command;
            if (command.onlyDeveloper) (command as NonGlobalCommands).guildId = this.config.guildIds;

            return command;
        };

        this.setServices({
            middlewares: StelleMiddlewares,
            cache: {
                disabledCache: {
                    bans: true,
                    emojis: true,
                    stickers: true,
                    roles: true,
                    presences: true,
                    stageInstances: true,
                },
            },
            handleCommand: class extends HandleCommand {
                override argsParser = Yuna.parser({
                    logResult: Constants.Debug,
                    syntax: {
                        namedOptions: ["-", "--"],
                    },
                });

                override resolveCommandFromContent = Yuna.resolver({
                    client: this.client,
                    logResult: Constants.Debug,
                });
            },
            langs: {
                default: this.config.defaultLocale,
                aliases: {
                    "es-419": ["es-ES"],
                },
            },
        });

        await this.start();
    }

    /**
     *
     * Reload Stelle.
     * @returns {Promise<void>} A promise, yeah... that's all.
     */
    public async reload(): Promise<void> {
        this.logger.warn("Attemping to reload...");

        try {
            await this.events.reloadAll();
            await this.commands.reloadAll();
            await this.langs.reloadAll();

            await this.uploadCommands({ cachePath: this.config.commands.filename });

            this.logger.info("Stelle has been reloaded.");
        } catch (error) {
            this.logger.error("Error -", error);
            throw error;
        }
    }
}
