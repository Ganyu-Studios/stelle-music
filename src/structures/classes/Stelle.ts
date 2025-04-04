import { Client } from "seyfert";
import { ActivityType, type GatewayPresenceUpdateData, PresenceUpdateStatus } from "seyfert/lib/types/index.js";
import type { StelleConfiguration } from "#stelle/types";

import { HandleCommand } from "seyfert/lib/commands/handle.js";
import { Yuna } from "yunaforseyfert";
import { Configuration } from "#stelle/utils/data/configuration.js";
import { Constants } from "#stelle/utils/data/constants.js";

/**
 * Class representing the main client of the bot.
 * @extends Client
 * @class Stelle
 */
export class Stelle extends Client<true> {
    /**
     * The client configuration.
     * @type {StelleConfiguration}
     * @default Configuration
     * @readonly
     */
    readonly config: StelleConfiguration = Configuration;

    /**
     * Creates an instance of the Stelle client.
     */
    constructor() {
        super({
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
     * The timestamp when the client is ready.
     * @type {number}
     * @default 0
     * @readonly
     */
    public readyTimestamp: number = 0;

    /**
     * Start the main process of the client.
     * @returns {Promise<void>} A promise, yay!
     */
    public async run(): Promise<void> {
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
