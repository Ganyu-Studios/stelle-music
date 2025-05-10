import {
    type ActionBuilderComponents,
    ActionRow,
    type AnyContext,
    Button,
    type ButtonInteraction,
    type Embed,
    type Message,
    type MessageBuilderComponents,
    StringSelectMenu,
    type StringSelectMenuInteraction,
    type WebhookMessage,
} from "seyfert";
import {
    type APIButtonComponentWithCustomId,
    type APIMessageActionRowComponent,
    ButtonStyle,
    ComponentType,
    MessageFlags,
} from "seyfert/lib/types/index.js";

import {
    type Awaitable,
    EmbedColors,
    type InteractionCreateBodyRequest,
    type InteractionMessageUpdateBodyRequest,
    type MakeRequired,
    type MessageWebhookCreateBodyRequest,
} from "seyfert/lib/common/index.js";
import type { CreateComponentCollectorResult } from "seyfert/lib/components/handler.js";
import type { Omit } from "#stelle/types";
import { InvalidComponentRun, InvalidComponentType, InvalidEmbedsLength, InvalidMessage, InvalidPageNumber, InvalidRow } from "./errors.js";

/**
 * The options of the paginator.
 */
interface PaginatorOptions {
    /**
     * The pages of the paginator.
     * @type {number}
     * @default 0
     */
    pages: number;
    /**
     * The embeds of the paginator.
     * @type {Embed[]}
     * @default []
     */
    embeds: Embed[];
    /**
     * The context reference of the paginator.
     * @type {AnyContext}
     */
    ctx: AnyContext;
    /**
     * The rows of the paginator.
     * @type {ActionRow<Components>[]}
     * @default []
     */
    rows: ActionRow<Components>[];
    /**
     * Disable the buttons of the paginator.
     * @type {boolean}
     * @default false
     */
    disabled: boolean;
    /**
     * The idle time of the paginator.
     * @type {number}
     * @default 60e3
     */
    time: number;
    /**
     * The message reference of the paginator.
     * @type {Message | WebhookMessage | null}
     * @default null
     */
    message: Message | WebhookMessage | null;
}

/**
 * The callback function of a component.
 */
type ComponentCallback<Interaction> = (interaction: Interaction, setPage: (n: number) => void) => Awaitable<unknown>;

/**
 * The components of a message.
 */
type Components = StelleButton | StelleStringMenu;

/**
 * The interaction of a component.
 */
type ComponentInteraction = ButtonInteraction & StringSelectMenuInteraction;

/**
 * The required options of the paginator.
 */
type RequiredPaginatorOptions = MakeRequired<Partial<Omit<PaginatorOptions, "message" | "pages">>, "ctx">;

// So, this is a custom id regex, it's not the best but it works.
const anyCustomId: RegExp = /./;

/**
 * The default time of the paginator.
 * @type {number}
 * @default 60e3
 */
const defaultTime: number = 60e3;

/**
 *
 * Get the current row of the paginator.
 * @param {EmbedPaginator} this The paginator instance.
 * @returns {ActionRow<MessageBuilderComponents>[]} The current row.
 */
function getRows(this: EmbedPaginator): ActionRow<MessageBuilderComponents>[] {
    const rows: ActionRow<MessageBuilderComponents>[] = [
        new ActionRow<MessageBuilderComponents>().addComponents(
            new Button()
                .setEmoji("<:forward:1061798317417312306>")
                .setStyle(ButtonStyle.Secondary)
                .setCustomId("pagination-pagePrev")
                .setDisabled(this.options.disabled || this.options.pages === 0),
            new Button()
                .setLabel(`${this.currentPage}/${this.maxPages}`)
                .setStyle(ButtonStyle.Primary)
                .setDisabled(true)
                .setCustomId("pagination-pagePos"),
            new Button()
                .setEmoji("<:next:1061798311671103528>")
                .setStyle(ButtonStyle.Secondary)
                .setCustomId("pagination-pageNext")
                .setDisabled(this.options.disabled || this.options.pages === this.options.embeds.length - 1),
        ),
    ];

    if (this.options.rows.length) rows.unshift(...this.options.rows);

    return rows;
}

/**
 * (Taken from Stelle, another project of mine)
 * @link https://github.com/Ganyu-Studios/stelle-music/blob/dev/src/structures/utils/Paginator.ts
 * So, is is the same paginator, but with some changes and some new stuff.
 */

/**
 * Class representing a custom button.
 * @extends Button
 */
export class StelleButton extends Button {
    /**
     * The function to run when the button is clicked.
     * @type {StelleButton["run"]}
     */
    public run?: ComponentCallback<ButtonInteraction>;

    /**
     * The data of the button.
     * @type {APIButtonComponentWithCustomId}
     */
    declare data: APIButtonComponentWithCustomId;

    /**
     *
     * The function to run when the button is clicked.
     * @param {StelleButton["run"]} run The function to run when the button is clicked.
     * @returns {this} The button instance.
     */
    public setRun(run: StelleButton["run"]): this {
        this.run = run;
        return this;
    }
}

/**
 * Class representing a custom string menu.
 * @extends StringSelectMenu
 */
export class StelleStringMenu extends StringSelectMenu {
    /**
     * The function to run when the string menu is clicked.
     * @type {StelleStringMenu["run"]}
     */
    public run?: ComponentCallback<StringSelectMenuInteraction>;

    /**
     * The data of the string menu.
     * @type {StringSelectMenu["data"]}
     */
    declare data: StringSelectMenu["data"];

    /**
     *
     * The function to run when the string menu is clicked.
     * @param {StelleStringMenu["run"]} run The function to run when the string menu is clicked.
     * @returns {this} The string menu instance.
     */
    public setRun(run: StelleStringMenu["run"]): this {
        this.run = run;
        return this;
    }
}

/**
 * Class representing an embed paginator.
 */
export class EmbedPaginator {
    /**
     * The options of the paginator.
     * @type {PaginatorOptions}
     */
    readonly options: PaginatorOptions;

    /**
     *
     * Create a new EmbedPagination instance
     * @param {RequiredPaginatorOptions} options The options of the paginator.
     */
    constructor(options: RequiredPaginatorOptions) {
        this.options = {
            ctx: options.ctx,
            embeds: options.embeds ?? [],
            rows: options.rows ?? [],
            disabled: options.disabled ?? false,
            time: options.time ?? defaultTime,
            pages: 0,
            message: null,
        };
    }

    /**
     *
     * Send the embed pagination.
     * @param {boolean} ephemeral If the message should be ephemeral.
     * @returns {this} The paginator instance.
     */
    public async reply(ephemeral: boolean = false): Promise<this> {
        if (!this.options.embeds.length) throw new InvalidEmbedsLength("I can't send the pagination without embeds.");

        const { messages } = await this.options.ctx.getLocale();

        this.options.message = await this.options.ctx.editOrReply(
            {
                content: "",
                embeds: [this.options.embeds[this.options.pages]],
                components: getRows.call(this),
                flags: ephemeral ? MessageFlags.Ephemeral : undefined,
            },
            true,
        );

        const collector: CreateComponentCollectorResult = this.options.message.createComponentCollector({
            idle: this.options.time,
            filter: (interaction): boolean => interaction.user.id === this.options.ctx.author.id,
            onPass: async (interaction): Promise<void> => {
                await interaction.write({
                    flags: MessageFlags.Ephemeral,
                    embeds: [
                        {
                            description: messages.events.noCollector({ userId: this.options.ctx.author.id }),
                            color: EmbedColors.Red,
                        },
                    ],
                });
            },
            onStop: async (reason): Promise<void> => {
                if (this.options.message && reason === "idle") {
                    await this.edit({
                        components: this.options.message.components.map((row): ActionRow<ActionBuilderComponents> => {
                            // ignore other components
                            if (row.data.type !== ComponentType.ActionRow) throw new InvalidRow("Invalid row type, expected ActionRow.");

                            return new ActionRow({
                                components: row.data.components.map((row): APIMessageActionRowComponent => {
                                    if (row.type === ComponentType.TextInput)
                                        throw new InvalidComponentType(`The component ${row.type} is not a valid component type`);

                                    row.disabled = true;

                                    // for some reason, the label saves the position it is in when the paginator is sent,
                                    // so, set it to 0/0 is the best option instead of returning the saved one.
                                    if ("label" in row && "custom_id" in row && row.custom_id === "pagination-pagePos") row.label = "0/0";

                                    return row;
                                }),
                            });
                        }),
                    });
                }
            },
        });

        collector.run<ButtonInteraction>(["pagination-pagePrev", "pagination-pageNext"], async (interaction): Promise<void> => {
            // just in case, i don't want to handle other interactions.
            if (!interaction.isButton()) return;

            if (interaction.customId === "pagination-pagePrev" && this.options.pages > 0) --this.options.pages;
            if (interaction.customId === "pagination-pageNext" && this.options.pages < this.options.embeds.length - 1) ++this.options.pages;

            await interaction.deferUpdate();
            await this.update();
        });

        if (this.options.rows.length) {
            collector.run<ComponentInteraction>(anyCustomId, (interaction): unknown => {
                for (const row of this.options.rows) {
                    for (const component of row.components) {
                        if ((component.data as { custom_id?: string }).custom_id === interaction.customId) {
                            if (!("run" in component && component.run))
                                throw new InvalidComponentRun(`The component: "${interaction.customId}" doesn't have a run callback.`);

                            return component.run(interaction, async (n): Promise<void> => {
                                if (n < 0 || n >= this.options.embeds.length) return;

                                this.options.pages = n;

                                // funny thing
                                if (!(await interaction.replied)) await interaction.deferUpdate();

                                await this.update();
                            });
                        }
                    }
                }
            });
        }

        return this;
    }

    /**
     * Get the max pages of the paginator.
     * @returns {number} The max pages.
     */
    public get maxPages(): number {
        return this.options.embeds.length;
    }

    /**
     * Get the current page of the paginator.
     * @returns {number} The current page.
     */
    public get currentPage(): number {
        return this.options.pages + 1;
    }

    /**
     *
     * Set a new array of embeds to display.
     * @param {Embed[]} embeds The embeds.
     */
    public setEmbeds(embeds: Embed[]): this {
        this.options.embeds = embeds;
        return this;
    }

    /**
     *
     * Set a new array of rows to display.
     * @param {ActionRow<Components>[]} rows The rows.
     * @returns {this} The paginator instance.
     */
    public setRows(rows: ActionRow<Components>[]): this {
        this.options.rows = rows;
        return this;
    }

    /**
     *
     * Set if the pagination buttons are disabled. (Exept the custom rows)
     * @param {boolean} disabled The disabled.
     * @default false
     * @returns {this} The paginator instance.
     */
    public setDisabled(disabled: boolean): this {
        this.options.disabled = disabled;
        return this;
    }

    /**
     *
     * Set the idle time of the paginator.
     * @param {number} time The time in milliseconds.
     * @default 60e3
     * @returns {this} The paginator instance.
     */
    public setTime(time: number = defaultTime): this {
        this.options.time = time;
        return this;
    }

    /**
     *
     * Set a page to desplay the embed.
     * @param {number} page The page.
     * @returns {this} The paginator instance.
     */
    public async setPage(page: number): Promise<this> {
        if (page < 1 || page > this.options.embeds.length)
            throw new InvalidPageNumber(`The page ${page} is invalid. There are ${this.options.embeds.length} pages.`);

        this.options.pages = page - 1;

        await this.update();

        return this;
    }

    /**
     *
     * Add a new row to display.
     * @param {ActionRow<Components>} row The row.
     * @returns {this} The paginator instance.
     */
    public addRow(row: ActionRow<Components>): this {
        this.options.rows.push(row);
        return this;
    }

    /**
     *
     * Add a new embed to display.
     * @param {Embed} embed The embed.
     */
    public addEmbed(embed: Embed): this {
        this.options.embeds.push(embed);
        return this;
    }

    /**
     *
     * Edit a current embed paginator.
     * @param {InteractionCreateBodyRequest | InteractionMessageUpdateBodyRequest} body The body.
     * @returns {Promise<this>} The paginator instance.
     */
    public async edit(body: InteractionCreateBodyRequest | InteractionMessageUpdateBodyRequest): Promise<this> {
        if (!this.options.message) throw new InvalidMessage("I can't edit the message to an unknown pagination.");

        await this.options.ctx.editOrReply(body).catch(() => null);

        return this;
    }

    /**
     *
     * Send a followup message. A shortcut to using the context followup method.
     * @param {MessageWebhookCreateBodyRequest} body The body of the message
     * @returns {Promise<this>} The paginator instance.
     */
    public async followup(body: MessageWebhookCreateBodyRequest): Promise<this> {
        await this.options.ctx.followup(body);
        return this;
    }

    /**
     *
     * Update the current embed paginator. A shortcut to using the edit method.
     * @returns {Promise<this>} The paginator instance.
     */
    public update(): Promise<this> {
        return this.edit({
            content: "",
            embeds: [this.options.embeds[this.options.pages]],
            components: getRows.call(this),
        });
    }
}
