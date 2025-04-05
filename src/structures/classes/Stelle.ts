import { Client, LimitedCollection } from "seyfert";
import { ActivityType, ApplicationCommandType, type GatewayPresenceUpdateData, PresenceUpdateStatus } from "seyfert/lib/types/index.js";
import type { NonGlobalCommands, StelleConfiguration } from "#stelle/types";

import { HandleCommand } from "seyfert/lib/commands/handle.js";
import { Yuna } from "yunaforseyfert";
import { Configuration } from "#stelle/utils/data/configuration.js";
import { Constants } from "#stelle/utils/data/constants.js";
import { StelleContext } from "#stelle/utils/functions/utils.js";

/**
 * Class representing the main client of the bot.
 * @extends Client
 * @class Stelle
 */
export class Stelle extends Client<true> {
    /**
     * The client configuration.
     * @default Configuration
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
                prefix: (): string[] => {
                    const prefixes: string[] = [...this.config.commands.prefixes, this.config.commands.defaultPrefix];
                    return prefixes.map((prefix): string => prefix.toLowerCase());
                },
                deferReplyResponse: ({ client }) => ({
                    content: `<a:typing:1214253750093488149> **${client.me.username}** ${Constants.ThinkMessage()}`,
                }),
            },
        });
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
}
