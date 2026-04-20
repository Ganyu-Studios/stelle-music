import {
    type ActionBuilderComponents,
    ActionRow,
    type AnyContext,
    Button,
    type ButtonInteraction,
    type Embed,
    type MessageStructure,
    StringSelectMenu,
    type StringSelectMenuInteraction,
    type WebhookMessageStructure,
} from "seyfert";
import {
    type Awaitable,
    EmbedColors,
    type InteractionCreateBodyRequest,
    type InteractionMessageUpdateBodyRequest,
    type MakeRequired,
    type MessageWebhookCreateBodyRequest,
} from "seyfert/lib/common/index.js";
import type { CreateComponentCollectorResult } from "seyfert/lib/components/handler.js";
import { ButtonStyle, MessageFlags } from "seyfert/lib/types/index.js";
import { type Omit, PaginatorButtonCustomIds, PaginatorButtonIdentifiers } from "#stelle/types";
import { InvalidComponentRun, InvalidEmbedsLength, InvalidMessage, InvalidPageNumber } from "./errors.js";
import { ms } from "./functions/time.js";
import { hasFlags, updateComponents } from "./functions/utils.js";

/**
 * The options of the paginator reply.
 */
interface PaginatorReplyOptions {
    /**
     * Whether the reply should be ephemeral or not.
     * @type {boolean}
     * @default false
     */
    ephemeral?: boolean;
    /**
     * Whether the reply should be followup or not. If true, it will send a followup message instead of editing the original message.
     * @type {boolean}
     * @default false
     */
    followup?: boolean;
}

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
    readonly ctx: AnyContext;
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
     * @default ms("1m")
     */
    time: number;
    /**
     * The message reference of the paginator.
     * @type {MessageStructure | WebhookMessageStructure | null}
     * @default null
     */
    message: MessageStructure | WebhookMessageStructure | null;
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
type PartialPaginatorOptions = MakeRequired<Partial<Omit<PaginatorOptions, "message" | "pages">>, "ctx">;

/**
 * A regex to match any custom id.
 * @type {RegExp}
 * @default /./
 */
// So, this is a custom id regex, it's not the best but it works.
const anyCustomId: RegExp = /./;

/**
 * The default time of the paginator.
 * @type {number}
 * @default ms("1m")
 */
const defaultTime: number = ms("1m");

/**
 *
 * Create the current row of the paginator.
 * @param {EmbedPaginator} self The paginator instance.
 * @returns {ActionRow<ActionBuilderComponents>[]} The current row.
 */
function createRow(self: EmbedPaginator): ActionRow<ActionBuilderComponents>[] {
    const rows: ActionRow<ActionBuilderComponents>[] = [
        new ActionRow<ActionBuilderComponents>().addComponents(
            new Button()
                .setEmoji("<:forward:1061798317417312306>")
                .setStyle(ButtonStyle.Secondary)
                .setCustomId(PaginatorButtonIdentifiers.Previous)
                .setDisabled(self.options.disabled || self.options.pages === 0),
            new Button()
                .setLabel(`${self.current}/${self.max}`)
                .setStyle(ButtonStyle.Primary)
                .setDisabled(true)
                .setCustomId(PaginatorButtonIdentifiers.Position),
            new Button()
                .setEmoji("<:next:1061798311671103528>")
                .setStyle(ButtonStyle.Secondary)
                .setCustomId(PaginatorButtonIdentifiers.Next)
                .setDisabled(self.options.disabled || self.options.pages === self.options.embeds.length - 1),
            new Button()
                .setEmoji("<:delete:1081644249197596692>")
                .setStyle(ButtonStyle.Danger)
                .setCustomId(PaginatorButtonIdentifiers.Delete)
                .setDisabled(self.options.disabled),
        ),
    ];

    if (self.options.rows.length) rows.unshift(...self.options.rows);

    return rows;
}

/**
 * Class representing a custom button.
 * @class StelleButton
 * @extends Button
 */
export class StelleButton extends Button {
    /**
     * The function to run when the button is clicked.
     * @type {StelleButton["run"]}
     */
    public run?: ComponentCallback<ButtonInteraction>;

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
 * @class StelleStringMenu
 * @extends StringSelectMenu
 */
export class StelleStringMenu extends StringSelectMenu {
    /**
     * The function to run when the string menu is clicked.
     * @type {StelleStringMenu["run"]}
     */
    public run?: ComponentCallback<StringSelectMenuInteraction>;

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
 * @class EmbedPaginator
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
     * @param {PartialPaginatorOptions} options The options of the paginator.
     */
    constructor(options: PartialPaginatorOptions) {
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
     * @param {PaginatorReplyOptions} options The options of the reply.
     * @returns {this} The paginator instance.
     */
    public async reply(options: PaginatorReplyOptions = {}): Promise<this> {
        if (!this.options.embeds.length) throw new InvalidEmbedsLength("I can't send the pagination without embeds.");

        const { messages } = await this.options.ctx.locale();
        const { ephemeral, followup } = options;

        const body: MessageWebhookCreateBodyRequest = {
            content: "",
            embeds: [this.options.embeds[this.options.pages]],
            components: createRow(this),
            flags: ephemeral ? MessageFlags.Ephemeral : undefined,
        };

        this.options.message = await (followup ? this.options.ctx.followup(body) : this.options.ctx.editOrReply(body, true));

        const collector: CreateComponentCollectorResult = this.options.message.createComponentCollector({
            idle: this.options.time,
            filter: (interaction): boolean => interaction.user.id === this.options.ctx.author.id,
            onPass: async (interaction): Promise<void> => {
                await interaction.editOrReply({
                    flags: MessageFlags.Ephemeral,
                    embeds: [
                        {
                            description: messages.events.onlyUser({ userId: this.options.ctx.author.id }),
                            color: EmbedColors.Red,
                        },
                    ],
                });
            },
            onStop: async (): Promise<void> => {
                if (this.options.message && !hasFlags(this.options.message.flags, [MessageFlags.Ephemeral])) {
                    await this.edit({
                        components: updateComponents(this.options.message, {
                            disabled: true,
                            label: "0/0",
                            customId: PaginatorButtonIdentifiers.Position,
                        }),
                    });
                }
            },
        });

        collector.run<ButtonInteraction>(PaginatorButtonCustomIds, async (interaction): Promise<void> => {
            // just in case, i don't want to handle other interactions.
            if (!interaction.isButton()) return;

            const { customId } = interaction;

            if (customId === PaginatorButtonIdentifiers.Previous && this.options.pages > 0) --this.options.pages;
            if (customId === PaginatorButtonIdentifiers.Next && this.options.pages < this.options.embeds.length - 1) ++this.options.pages;
            if (customId === PaginatorButtonIdentifiers.Delete) {
                await interaction.deferUpdate();
                await this.options.message?.delete().catch((): null => null);

                this.options.message = null;

                return collector.stop();
            }

            await interaction.deferUpdate();
            await this.update();
        });

        if (this.options.rows.length) {
            collector.run<ComponentInteraction>(anyCustomId, (interaction): unknown => {
                for (const row of this.options.rows) {
                    for (const component of row.components) {
                        if ((component.data as { custom_id?: string }).custom_id === interaction.customId) {
                            if (!("run" in component && component.run) || typeof component.run !== "function")
                                throw new InvalidComponentRun(`The component: "${interaction.customId}" doesn't have a run callback.`);

                            return component.run(interaction, async (n): Promise<void> => {
                                if (n < 0 || n >= this.options.embeds.length) return;

                                this.options.pages = n;

                                // funny thing
                                if (!(await interaction.replied) || !interaction.deferred) await interaction.deferUpdate();

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
    public get max(): number {
        return this.options.embeds.length;
    }

    /**
     * Get the current page of the paginator.
     * @returns {number} The current page.
     */
    public get current(): number {
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

        await this.options.message.edit(body).catch((): null => null);

        return this;
    }

    /**
     *
     * Send a followup message. A shortcut to using the context followup method.
     * @param {MessageWebhookCreateBodyRequest} body The body of the message
     * @returns {Promise<this>} The paginator instance.
     */
    public async followup(body: MessageWebhookCreateBodyRequest): Promise<this> {
        this.options.message = await this.options.ctx.followup(body);
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
            components: createRow(this),
        });
    }
}
