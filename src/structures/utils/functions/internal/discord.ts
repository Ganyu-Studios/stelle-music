import type { TrackRequester, TrackStructure } from "hoshimi";
import {
    ActionRow,
    type Button,
    Container,
    type DefaultLocale,
    Embed,
    type GuildComponentContext,
    type MessageStructure,
    User,
    type UsingClient,
    type WebhookMessageStructure,
} from "seyfert";
import { type ColorResolvable, type PermissionStrings, resolvePartialEmoji } from "seyfert/lib/common/index.js";
import { PermissionsBitField } from "seyfert/lib/structures/extra/Permissions.js";
import {
    type APIActionRowComponent,
    type APIActionRowComponentTypes,
    type APIButtonComponent,
    type APIContainerComponent,
    type APIContainerComponents,
    type APIMessageComponentEmoji,
    type APISectionComponent,
    ButtonStyle,
    ComponentType,
} from "seyfert/lib/types/index.js";
import type { EditButtonOptions, PermissionNames, StelleConfiguration, WebhookMetadata } from "#stelle/types";
import { InvalidRow } from "#stelle/utils/errors.js";
import { TimeFormat } from "../time.js";
import { omitKeys } from "../utils.js";

/**
 * Resolve a guild's locale object from the database, deduping the
 * `client.t(await client.database.locales.get(guildId)).get()` dance repeated by the code paths that resolve a locale
 * outside a command context (where `ctx.locale()` isn't available).
 * @param {UsingClient} client The client instance.
 * @param {string} guildId The guild id.
 * @returns {Promise<DefaultLocale>} The resolved locale object.
 */
export async function resolveLocale(client: UsingClient, guildId: string): Promise<DefaultLocale> {
    return client.t(await client.database.locales.get(guildId)).get();
}

/**
 *
 * Parse a Discord webhook URL and return its id and token.
 * @param {string} url The webhook URL to parse.
 * @returns {WebhookMetadata | null} The parsed webhook metadata, or null if the URL is invalid.
 */
export function parseDiscordWebhook(url: string): WebhookMetadata | null {
    const regex = /https?:\/\/(?:ptb\.|canary\.)?discord\.com\/api(?:\/v\d{1,2})?\/webhooks\/(?<id>\d{17,19})\/(?<token>[\w-]{68})/i;

    const match: RegExpExecArray | null = regex.exec(url);
    if (!match?.groups) return null;

    return { id: match.groups.id, token: match.groups.token };
}

/**
 *
 * Transform the requester user into a simple object.
 * @param {unknown} requester The requester user.
 * @returns {StelleUser} The transformed user.
 */
export const requesterFn = <T = TrackRequester>(requester: TrackRequester): T => {
    if (requester instanceof User)
        return {
            ...omitKeys(requester as User & Record<string, unknown>, [
                "client",
                "avatarDecorationData",
                "banner",
                "createdAt",
                "discriminator",
                "flags",
                "publicFlags",
                "accentColor",
                "system",
                "verified",
                "email",
                "mfaEnabled",
                "primaryGuild",
                "premiumType",
                "locale",
                "name",
                "createdTimestamp",
                "globalName",
                "avatar",
                "displayNameStyles",
                "collectibles",
                "clan",
                "bot",
                "application",
                "bannerColor",
                "bio",
            ]),
            tag: requester.bot ? requester.username : requester.tag,
        } as T;

    return requester as T;
};

/**
 *
 * Update buttons in a message, with optional overrides for specific buttons.
 * @param {MessageStructure | WebhookMessageStructure} message The message to edit the components of.
 * @param {EditButtonOptions} options The options to edit the rows.
 * @returns {(ActionRow<Button> | Container)[]} The edited components.
 */
export const updateComponents = (
    message: MessageStructure | WebhookMessageStructure,
    options?: Partial<EditButtonOptions>,
): Array<ActionRow<Button> | Container> =>
    message.components.map((builder): ActionRow<Button> | Container => {
        const topLevel = builder.toJSON();

        const updateButton = (component: APIButtonComponent): APIButtonComponent => {
            if (component.style === ButtonStyle.Link || component.style === ButtonStyle.Premium) return component;

            if (options?.disabled) component.disabled = options.disabled;

            if (options && "custom_id" in component && component.custom_id === options.customId) {
                options.style ??= component.style;

                if (options.emoji) component.emoji = resolvePartialEmoji(options.emoji) as APIMessageComponentEmoji | undefined;

                component.label = options.label;
                component.style = options.style;
            }

            return component;
        };

        const updateButtons = (components: APIActionRowComponentTypes[]): APIActionRowComponentTypes[] =>
            components.map((component): APIActionRowComponentTypes => {
                if (component.type !== ComponentType.Button) return component;
                return updateButton(component);
            });

        if (topLevel.type === ComponentType.ActionRow) {
            const row: APIActionRowComponent<APIActionRowComponentTypes> = {
                ...topLevel,
                components: updateButtons(topLevel.components),
            };

            return new ActionRow<Button>(row);
        }

        if (topLevel.type === ComponentType.Container) {
            const container: APIContainerComponent = {
                ...topLevel,
                components: topLevel.components.map((nested): APIContainerComponents => {
                    if (nested.type === ComponentType.ActionRow) {
                        return {
                            ...nested,
                            components: updateButtons(nested.components),
                        };
                    }

                    if (nested.type === ComponentType.Section && nested.accessory?.type === ComponentType.Button) {
                        const section: APISectionComponent = {
                            ...nested,
                            accessory: updateButton(nested.accessory),
                        };

                        return section;
                    }

                    return nested;
                }),
            };

            return new Container(container);
        }

        throw new InvalidRow("Invalid component type, expected ActionRow or Container.");
    });

/**
 * Defer a button interaction and re-render its source message with a single control button updated. Shared by the
 * player control buttons (pause / autoplay / loop), which all toggle player state and then repaint their own button.
 * @param {GuildComponentContext<"Button">} ctx The button component context.
 * @param {Partial<EditButtonOptions>} options The button update to apply (custom id, label, style...).
 * @returns {Promise<void>} A promise that resolves once the message is edited.
 */
export async function refreshComponents(ctx: GuildComponentContext<"Button">, options: Partial<EditButtonOptions>): Promise<void> {
    await ctx.interaction.deferUpdate();
    await ctx.interaction.message.edit({
        components: updateComponents(ctx.interaction.message, options),
    });
}

/**
 * The minimal shape `sendGuildLog` reads off a guild, so it accepts both the guildCreate and guildDelete payloads
 * without depending on their (differently-narrowed) structural types.
 */
interface GuildLogSource {
    id: string;
    name: string;
    memberCount?: number;
    fetchOwner(): Promise<{ displayName: string } | null>;
}

/**
 * Send a guild join/leave log embed to the configured guilds channel. The guildCreate and guildDelete events build the
 * same four-field embed and differ only in color, title and description.
 * @param {UsingClient} client The client instance.
 * @param {GuildLogSource} guild The guild that was added or removed.
 * @param {{ color: ColorResolvable; title: string; description: string }} options The embed accents.
 * @returns {Promise<void>} A promise that resolves once the log is written.
 */
export async function sendGuildLog(
    client: UsingClient,
    guild: GuildLogSource,
    options: { color: ColorResolvable; title: string; description: string },
): Promise<void> {
    const owner = await guild.fetchOwner().catch((): null => null);
    const ownerName: string = owner?.displayName ?? "Unknown";

    const embed = new Embed()
        .setColor(options.color)
        .setTitle(options.title)
        .setDescription(options.description)
        .addFields(
            { name: "`📜` Name", value: `\`${guild.name}\``, inline: true },
            { name: "`👤` Owner", value: `\`${ownerName}\``, inline: true },
            { name: "`🏮` ID", value: `\`${guild.id}\``, inline: true },
            { name: "`👥` Members", value: `\`${guild.memberCount}\``, inline: true },
        );

    await client.messages.write(client.config.channels.guildsId, { embeds: [embed] });
}

/**
 *
 * Apply the deleter configuration to a component interaction, either deleting the message or clearing its components based on the specified key.
 * @param {GuildComponentContext<"Button">} ctx The component interaction context.
 * @param {keyof StelleConfiguration["deleter"]} kind The deleter configuration key to check.
 * @returns {Promise<void>} A promise that resolves when the action is complete.
 */
export const applyDeleter = async (ctx: GuildComponentContext<"Button">, kind: keyof StelleConfiguration["deleter"]): Promise<void> => {
    await ctx.interaction.deferUpdate();

    if (ctx.client.config.deleter[kind]) await ctx.interaction.message.delete().catch((): null => null);
    else await ctx.interaction.message.edit({ components: [] });
};

/**
 *
 * A utility function to get the permission keys from the permissions bitfield.
 * @param {PermissionStrings} permissions The permissions to get the keys from.
 * @returns {PermissionNames[]} The permission keys.
 */
export const getPermissionKeys = (permissions: PermissionStrings): PermissionNames[] =>
    new PermissionsBitField(permissions.map((p): bigint => PermissionsBitField.resolve(p))).keys();

/**
 * Format the track time for display, showing "Live" for streams and a dotted time format for regular tracks.
 * @param {TrackStructure} track The track to format the time for.
 * @param {DefaultLocale} messages The locale object for localized messages.
 * @returns {string} The formatted time string.
 */
export const formatDuration = (track: TrackStructure, messages: DefaultLocale["messages"]): string =>
    track.info.isStream ? messages.commands.play.live : (TimeFormat.toDotted(track.info.length) ?? messages.commands.play.undetermined);
