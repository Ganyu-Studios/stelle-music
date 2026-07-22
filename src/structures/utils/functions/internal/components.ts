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

export const ComponentOps = {
    /**
     *
     * Update buttons in a message, with optional overrides for specific buttons.
     * @param {MessageStructure | WebhookMessageStructure} message The message to edit the components of.
     * @param {EditButtonOptions} options The options to edit the rows.
     * @returns {(ActionRow<Button> | Container)[]} The edited components.
     */
    update(
        message: MessageStructure | WebhookMessageStructure,
        options?: Partial<EditButtonOptions>,
    ): Array<ActionRow<Button> | Container> {
        return message.components.map((builder): ActionRow<Button> | Container => {
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
    },
    /**
     *
     * Refresh a message's components, optionally updating a specific button.
     * @param {GuildComponentContext<"Button">} ctx The context of the button interaction.
     * @param {Partial<EditButtonOptions>} options The options to edit the rows.
     * @returns {Promise<void>} A promise that resolves when the message is updated.
     */
    async refresh(ctx: GuildComponentContext<"Button">, options: Partial<EditButtonOptions>): Promise<void> {
        await ctx.interaction.deferUpdate();
        await ctx.interaction.message.edit({
            components: ComponentOps.update(ctx.interaction.message, options),
        });
    },
    /**
     *
     * Cleanup a message's components, optionally deleting the message or clearing the components.
     * @param {GuildComponentContext<"Button">} ctx The context of the button interaction.
     * @param {keyof StelleConfiguration["deleter"]} kind The type of deletion to perform.
     * @returns {Promise<void>} A promise that resolves when the cleanup is complete.
     */
    async cleanup(ctx: GuildComponentContext<"Button">, kind: keyof StelleConfiguration["deleter"]): Promise<void> {
        await ctx.interaction.deferUpdate();

        if (ctx.client.config.deleter[kind]) await ctx.interaction.message.delete().catch((): null => null);
        else await ctx.interaction.message.edit({ components: [] });
    },
};
