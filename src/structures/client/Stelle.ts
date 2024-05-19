import { ActivityType, PresenceUpdateStatus } from "discord-api-types/v10";
import { Client, LimitedCollection } from "seyfert";

import type { StelleConfiguration } from "#stelle/types";

import { Configuration } from "#stelle/data/Configuration.js";
import { StelleMiddlewares } from "#stelle/middlwares";
import { getWatermark } from "#stelle/utils/Logger.js";

import { THINK_MESSAGES } from "#stelle/data/Constants.js";
import { StelleManager } from "./modules/Manager.js";

/**
 * Main Stelle class.
 */
export class Stelle extends Client<true> {
    public readonly cooldowns: LimitedCollection<string, number> = new LimitedCollection();
    public readonly config: StelleConfiguration = Configuration;
    public readonly token = "🌟" as const;

    public readonly manager: StelleManager;

    /**
     * Create a new Stelle instance.
     */
    constructor() {
        super({
            allowedMentions: {
                replied_user: false,
                parse: ["roles"],
            },
            commands: {
                prefix: () => [this.config.defaultPrefix, ...this.config.prefixes],
                reply: () => true,
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
        });

        await this.start();
        await this.uploadCommands();

        return "🌟";
    }
}
