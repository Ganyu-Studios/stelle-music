import {
    ActionRow,
    type Button,
    Container,
    type GuildComponentContext,
    type MessageStructure,
    type WebhookMessageStructure,
} from "seyfert";
import { resolvePartialEmoji } from "seyfert/lib/common/index.js";
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
import type { EditButtonOptions, StelleConfiguration } from "#stelle/types";
import { InvalidRow } from "#stelle/utils/errors.js";

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
