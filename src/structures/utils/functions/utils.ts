import { inspect } from "node:util";
import type { Player, RepeatMode } from "lavalink-client";

import {
    ActionRow,
    type ActionRowMessageComponents,
    type AnyContext,
    type Button,
    type ClientUser,
    type DefaultLocale,
    type User,
    extendContext,
} from "seyfert";
import type { MessageActionRowComponent } from "seyfert/lib/components/ActionRow.js";
import { ButtonStyle, ComponentType } from "seyfert/lib/types/index.js";
import type { AutoplayMode, EditButtonsOptions, PausedMode, StelleUser } from "#stelle/types";

/**
 * Stelle custom context.
 */
export const customContext = extendContext((interaction) => ({
    /**
     *
     * Get the locale from the database.
     * @returns The locales object.
     */
    getLocale: async (): Promise<DefaultLocale> => {
        if (!interaction.guildId) return interaction.client.t(interaction.user.locale ?? interaction.client.config.defaultLocale).get();
        return interaction.client.t(await interaction.client.database.getLocale(interaction.guildId)).get();
    },
    /**
     *
     * Get the locale string from the database.
     * @returns The locale string.
     */
    getLocaleString: async (): Promise<string> => {
        if (!interaction.guildId) return interaction.user.locale ?? interaction.client.config.defaultLocale;
        const locale = await interaction.client.database.getLocale(interaction.guildId);
        return locale;
    },
}));

/**
 *
 * Create and Get the cooldown collection key.
 * @param ctx The context.
 * @returns
 */
export const getCollectionKey = (ctx: AnyContext): string => {
    const authorId = ctx.author.id;

    if (ctx.isChat() || ctx.isMenu() || ctx.isEntryPoint()) return `${authorId}-${ctx.fullCommandName}-command`;
    if (ctx.isComponent() || ctx.isModal()) return `${authorId}-${ctx.customId}-component`;

    return `${authorId}-all`;
};

/**
 *
 * Create a new progress bar.
 * @param player The player.
 * @returns
 */
export const createBar = (player: Player): string => {
    const size = 15;
    const line = "▬";
    const slider = "🔘";

    if (!player.queue.current) return `${slider}${line.repeat(size - 1)}`;

    const current = player.position;
    const total = player.queue.current.info.duration;

    const progress = Math.min(current / total, 1);
    const filledLength = Math.round(size * progress);
    const emptyLength = size - filledLength;

    return `${line.repeat(filledLength).slice(0, -1)}${slider}${line.repeat(emptyLength)}`;
};

/**
 *
 * Stelle loop state.
 * @param mode The mode.
 * @param alt Return the alternative state.
 * @returns
 */
export const getLoopState = (mode: RepeatMode, alt?: boolean) => {
    const states: Record<RepeatMode, RepeatMode> = {
        off: "track",
        track: "queue",
        queue: "off",
    };

    if (alt) {
        states.off = "off";
        states.track = "track";
        states.queue = "queue";
    }

    return states[mode];
};

/**
 *
 * Parses a webhook url.
 * @param url The webhook url.
 * @returns
 */
export const parseWebhook = (url: string) => {
    const webhookRegex = /https?:\/\/(?:ptb\.|canary\.)?discord\.com\/api(?:\/v\d{1,2})?\/webhooks\/(\d{17,19})\/([\w-]{68})/i;
    const match = webhookRegex.exec(url);

    return match ? { id: match[1], token: match[2] } : null;
};

/**
 *
 * Edit a non-link or non-premium button rows with specific options.
 * @param rows The rows to edit.
 * @param options The options to edit the rows.
 * @returns
 */
export const editButtons = (
    rows: MessageActionRowComponent<ActionRowMessageComponents>[],
    options: EditButtonsOptions,
): ActionRow<Button>[] =>
    rows.map((builder) => {
        const row = builder.toJSON();
        return new ActionRow<Button>({
            components: row.components.map((component) => {
                if (component.type !== ComponentType.Button) return component;
                if (component.style === ButtonStyle.Link || component.style === ButtonStyle.Premium) return component;
                if (component.custom_id === options.customId) {
                    options.style ??= component.style;

                    component.label = options.label;
                    component.style = options.style;
                }

                return component;
            }),
        });
    });

/**
 *
 * Transform the requester user into a simple object.
 * @param requester The requester user.
 * @returns
 */
export const requesterTransformer = (requester: unknown): StelleUser => {
    const requesterUser = requester as User | ClientUser;
    const user = omitKeys(requesterUser, ["client"]);

    return {
        ...user,
        global_name: requesterUser.username,
        tag: requesterUser.bot ? requesterUser.username : requesterUser.tag,
    };
};

/**
 *
 * Omit keys from an object.
 * @param obj The object to omit keys.
 * @param keys The keys to omit.
 * @returns
 */
export const omitKeys = <T extends Record<string, any>, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> =>
    Object.fromEntries(Object.entries(obj).filter(([key]) => !keys.includes(key as K))) as Omit<T, K>;

/**
 *
 * Stelle autoplay state.
 * @param boolean The boolean.
 * @returns
 */
export const getAutoplayState = (boolean: boolean): AutoplayMode => (boolean ? "enabled" : "disabled");

/**
 *
 * Stelle pause state.
 * @param boolean The boolean.
 * @returns
 */
export const getPauseState = (boolean: boolean): PausedMode => (boolean ? "resume" : "pause");

/**
 *
 * Representation of a object.
 * @param error The error.
 * @returns
 */
export const getInspect = (error: any, depth: number = 0): string => inspect(error, { depth });

/**
 *
 * Slice text.
 * @param text The text.
 * @returns
 */
export const sliceText = (text: string, max: number = 100) => (text.length > max ? `${text.slice(0, max)}...` : text);
