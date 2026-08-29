import { createClient, type RedisClientType } from "@redis/client";
import { Structures } from "hoshimi";
import { Client, LimitedCollection, LimitedMemoryAdapter, type LogLevels, type MessageStructure } from "seyfert";
import { HandleCommand } from "seyfert/lib/commands/handle.js";
import { ActivityType, type GatewayPresenceUpdateData, PresenceUpdateStatus } from "seyfert/lib/types/index.js";
import { Yuna } from "yunaforseyfert";
import { StelleDatabase } from "#stelle/classes/database/Database.js";
import { StelleManager } from "#stelle/classes/manager/Manager.js";
import { StelleMiddlewares } from "#stelle/middlewares";
import type { StelleConfiguration } from "#stelle/types";
import { Configuration } from "#stelle/utils/data/configuration.js";
import { StelleMeta, StellePaths, StelleRedis, StelleText } from "#stelle/utils/data/constants.js";
import { StelleContext } from "#stelle/utils/functions/internal/context.js";
import { LoggerOps } from "#stelle/utils/functions/internal/logger.js";
import { onBotPermissionsFail, onOptionsError, onPermissionsFail, onRunError } from "#stelle/utils/functions/internal/overrides.js";
import { sendErrorReport } from "#stelle/utils/functions/internal/report.js";
import { UtilsOps } from "#stelle/utils/functions/internal/utils.js";
import { type PluginsDefinition, plugins } from "#stelle/utils/plugins.js";
import { HoshimiLyricsManager } from "../manager/LyricsManager.js";

/**
 * Class representing the main client of the bot.
 * @extends Client
 * @class Stelle
 */
export class Stelle extends Client<PluginsDefinition, true> {
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
     * The Redis client instance.
     * @type {RedisClientType}
     * @readonly
     */
    readonly redis: RedisClientType = createClient({ url: StelleRedis.GetUrl() });

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
            plugins,
            context: StelleContext,
            globalMiddlewares: ["checkCooldown", "checkVerifications"],
            presence: (): GatewayPresenceUpdateData => ({
                afk: false,
                since: Date.now(),
                status: PresenceUpdateStatus.Idle,
                activities: [{ name: "Traveling... 🌠", type: ActivityType.Playing }],
            }),
            allowedMentions: {
                replied_user: false,
                parse: ["roles", "users"],
            },
            components: {
                defaults: {
                    onRunError,
                },
            },
            commands: {
                reply: (): boolean => true,
                prefix: async ({ client, guildId }): Promise<string[]> => {
                    const prefixes: string[] = [...client.config.prefixes, client.config.defaultPrefix];

                    if (guildId) prefixes.push(await client.database.prefixes.get(guildId));

                    return prefixes.map((prefix): string => prefix.toLowerCase());
                },
                deferReplyResponse: ({ client }) => ({
                    content: `<a:typing:1214253750093488149> **${client.me.username}** ${StelleText.Think()}`,
                }),
                defaults: {
                    onBotPermissionsFail,
                    onOptionsError,
                    onPermissionsFail,
                    onRunError,
                },
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
        await LoggerOps.watermark();

        Structures.LyricsManager = (...args) => new HoshimiLyricsManager(...args);

        this.setServices({
            middlewares: StelleMiddlewares,
            cache: {
                adapter: new LimitedMemoryAdapter({
                    message: {
                        expire: this.config.cache.expire,
                        limit: this.config.cache.limit,
                    },
                }),
                disabledCache: {
                    bans: true,
                    emojis: true,
                    stickers: true,
                    roles: true,
                    overwrites: true,
                    presences: true,
                    stageInstances: true,
                },
            },
            handleCommand: class extends HandleCommand {
                override argsParser = Yuna.parser({
                    logResult: StelleMeta.Debug,
                    syntax: {
                        namedOptions: ["-", "--"],
                    },
                });

                override resolveCommandFromContent = Yuna.resolver({
                    client: this.client,
                    logResult: StelleMeta.Debug,
                    afterPrepare: (metadata): void => {
                        if (StelleMeta.Debug) this.client.logger.debug(`[Client] Commands prepared | count: ${metadata.commands.length}`);
                    },
                });
            },
            langs: {
                default: this.config.defaultLocale,
                aliases: {
                    "es-419": ["es-ES"],
                },
            },
        });

        if (this.cache.messages) this.cache.messages.filter = (message): boolean => message.author.id === this.botId;

        this.events.onFail = (_, error): Promise<MessageStructure | void> => sendErrorReport({ error });

        this.redis.on("connect", (): void => this.logger.info("[Redis] Connected"));
        this.redis.on("error", (error): void => this.logger.error(`[Redis] Client error | error: ${UtilsOps.inspect(error)}`));

        await this.redis.connect();
        await this.manager.load();
        await this.start();
    }

    /**
     *
     * Reload Stelle.
     * @returns {Promise<void>} A promise, yeah... that's all.
     */
    public async reload(): Promise<void> {
        this.logger.warn("[Client] Reload started");

        const cachePath: string = StellePaths.GetCommandsPath();

        try {
            await this.events.reloadAll();
            await this.commands.reloadAll();
            await this.langs.reloadAll();
            await this.manager.reloadAll();
            await this.config.reload();

            await this.uploadCommands({ cachePath });

            this.logger.info("[Client] Reload completed");
        } catch (error) {
            this.logger.error(`[Client] Reload failed | error: ${UtilsOps.inspect(error)}`);
            throw error;
        }
    }

    /**
     * Logs a message through the debug logger at the given level.
     *
     * This targets {@link debugger} — the opt-in logger Seyfert only creates when the bot runs with `--debug` — not the
     * always-on {@link logger}. It is a no-op outside debug mode: the `StelleMeta.Debug` flag short-circuits before the
     * logger is touched, and the `this.debugger` guard covers the edge case where the flag is set but the logger was
     * never created.
     * @param {LogLevels} level The severity level for the entry.
     * @param {...unknown} args The message(s) to log.
     * @returns {void}
     */
    public debug(level: LogLevels, ...args: unknown[]): void {
        if (!StelleMeta.Debug || !this.debugger) return;

        this.debugger.rawLog(level, ...args);
    }
}
