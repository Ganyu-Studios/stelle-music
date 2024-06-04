import { ActivityType, PresenceUpdateStatus } from "discord-api-types/v10";
import { Client, LimitedCollection } from "seyfert";

import type { InternalRuntime, InternalStelleRuntime, StelleConfiguration } from "#stelle/types";

import { StelleMiddlewares } from "#stelle/middlwares";
import { YunaParser } from "#stelle/parser";

import { Configuration } from "#stelle/data/Configuration.js";
import { getWatermark } from "#stelle/utils/Logger.js";
import { onBotPermissionsFail, onOptionsError, onPermissionsFail, onRunError } from "#stelle/utils/functions/overrides.js";
import { customContext, stelleRC } from "#stelle/utils/functions/utils.js";

import { StelleDatabase } from "./modules/Database.js";
import { StelleManager } from "./modules/Manager.js";

import { THINK_MESSAGES } from "#stelle/data/Constants.js";

/**
 * Main Stelle class.
 */
export class Stelle extends Client<true> {
    public readonly cooldowns: LimitedCollection<string, number> = new LimitedCollection();
    public readonly config: StelleConfiguration = Configuration;
    public readonly token = "🌟" as const;

    public readyTimestamp: number = 0;

    public readonly manager: StelleManager;
    public readonly database: StelleDatabase;

    /**
     * Create a new Stelle instance.
     */
    constructor() {
        super({
            context: customContext,
            globalMiddlewares: ["checkCooldown", "checkVerifications"],
            allowedMentions: {
                replied_user: false,
                parse: ["roles"],
            },
            components: {
                defaults: {
                    onRunError,
                },
            },
            commands: {
                prefix: () => [this.config.defaultPrefix, ...this.config.prefixes],
                reply: () => true,
                defaults: {
                    onBotPermissionsFail,
                    onOptionsError,
                    onPermissionsFail,
                    onRunError,
                },
                argsParser: YunaParser({
                    useUniqueNamedSyntaxAtSameTime: true,
                    enabled: {
                        namedOptions: ["-", "--"],
                    },
                }),
                deferReplyResponse: ({ client }) => ({
                    content: `<a:typing:1214253750093488149> **${client.me.username}** ${
                        THINK_MESSAGES[Math.floor(Math.random() * THINK_MESSAGES.length)]
                    }`,
                }),
            },
            presence: () => ({
                afk: false,
                since: Date.now(),
                status: PresenceUpdateStatus.Idle,
                activities: [{ name: "Traveling... 🌠", type: ActivityType.Playing }],
            }),
        });

        this.manager = new StelleManager(this);
        this.database = new StelleDatabase(this);

        this.run();
    }

    /**
     *
     * Start the main Stelle process.
     * @returns
     */
    private async run(): Promise<typeof this.token> {
        getWatermark();

        this.setServices({
            middlewares: StelleMiddlewares,
            langs: { default: this.config.defaultLocale },
        });

        await this.start();
        await this.manager.load();
        await this.uploadCommands();

        return "🌟";
    }

    /**
     *
     * Overrides the original `runtime configuration`.
     * @returns
     */
    public override getRC<T extends InternalRuntime = InternalRuntime>(): Promise<InternalStelleRuntime<T>> {
        return stelleRC();
    }

    /**
     *
     * Reload Stelle..
     * @returns
     */
    public async reload(): Promise<void> {
        this.logger.warn("Attemping to reload...");

        try {
            await this.events?.reloadAll();
            await this.commands?.reloadAll();
            await this.components?.reloadAll();
            await this.manager.handler.reloadAll();

            this.logger.info("Stelle has been reloaded.");
        } catch (error) {
            this.logger.error("Error -", error);
            throw error;
        }
    }
}
