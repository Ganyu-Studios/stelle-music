import {
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
import { type APIButtonComponentWithCustomId, ButtonStyle, MessageFlags } from "seyfert/lib/types/index.js";

import {
    type Awaitable,
    EmbedColors,
    type InteractionCreateBodyRequest,
    type InteractionMessageUpdateBodyRequest,
} from "seyfert/lib/common/index.js";
import { InvalidComponentRun, InvalidEmbedsLength, InvalidMessage, InvalidPageNumber } from "./Errors.js";

/**
 * Stelle button class.
 */
export class StelleButton extends Button {
    /**
     * The function to run when the button is clicked.
     */
    public run!: (interaction: ButtonInteraction, setPage: (n: number) => void) => Awaitable<unknown>;

    /**
     * The data of the button.
     */
    declare data: APIButtonComponentWithCustomId;

    /**
     *
     * The function to run when the button is clicked.
     * @param run The function to run when the button is clicked.
     * @returns
     */
    public setRun(run: StelleButton["run"]): this {
        this.run = run;
        return this;
    }
}

/**
 * Stelle string menu class.
 */
export class StelleStringMenu extends StringSelectMenu {
    /**
     * The function to run when the string menu is clicked.
     */
    public run!: (interaction: StringSelectMenuInteraction, setPage: (n: number) => void) => Awaitable<unknown>;

    /**
     * The data of the string menu.
     */
    declare data: StringSelectMenu["data"];

    /**
     *
     * The function to run when the string menu is clicked.
     * @param run The function to run when the string menu is clicked.
     * @returns
     */
    public setRun(run: StelleStringMenu["run"]): this {
        this.run = run;
        return this;
    }
}

type StelleComponents = StelleButton | StelleStringMenu;
type StelleComponentInteraction = ButtonInteraction & StringSelectMenuInteraction;

/**
 * Main Stelle paginator class.
 */
export class EmbedPaginator {
    /**
     * The pages of the paginator.
     */
    protected pages: number = 0;

    /**
     * The embeds of the paginator.
     */
    private embeds: Embed[] = [];
    /**
     * The message reference of the paginator.
     */
    private message: Message | WebhookMessage | null = null;
    /**
     * The context reference of the paginator.
     */
    private ctx: AnyContext;
    /**
     * The rows of the paginator.
     */
    private rows: ActionRow<StelleButton | StelleStringMenu>[] = [];
    /**
     * The disabled type of the paginator.
     */
    private disabled: boolean = false;

    /**
     *
     * Create a new EmbedPagination instance.
     * @param options The options.
     */
    constructor(ctx: AnyContext) {
        this.ctx = ctx;
    }

    /**
     *
     * Get the current row of the paginator.
     * @returns
     */
    private getRows(): ActionRow<MessageBuilderComponents>[] {
        const rows: ActionRow<MessageBuilderComponents>[] = [
            new ActionRow<MessageBuilderComponents>().addComponents(
                new Button()
                    .setEmoji("<:forward:1061798317417312306>")
                    .setStyle(ButtonStyle.Secondary)
                    .setCustomId("pagination-pagePrev")
                    .setDisabled(this.disabled || this.pages === 0),
                new Button()
                    .setLabel(`${this.currentPage}/${this.maxPages}`)
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(true)
                    .setCustomId("pagination-pagePos"),
                new Button()
                    .setEmoji("<:next:1061798311671103528>")
                    .setStyle(ButtonStyle.Secondary)
                    .setCustomId("pagination-pageNext")
                    .setDisabled(this.disabled || this.pages === this.embeds.length - 1),
            ),
        ];

        if (this.rows.length) rows.unshift(...this.rows);

        return rows;
    }

    /**
     *
     * Create the component collector.
     * @returns
     */
    private async createCollector() {
        const { messages } = await this.ctx.getLocale();

        if (!this.message) return;

        const collector = this.message.createComponentCollector({
            idle: 60e3,
            filter: (interaction) => interaction.user.id === this.ctx.author.id,
            onPass: async (interaction) => {
                await interaction.write({
                    flags: MessageFlags.Ephemeral,
                    embeds: [
                        {
                            description: messages.events.noCollector({ userId: this.ctx.author.id }),
                            color: EmbedColors.Red,
                        },
                    ],
                });
            },
            onStop: async (reason) => {
                if (reason === "idle") {
                    const components: ActionRow<Button | StringSelectMenu>[] = [];

                    for (const component of this.message!.components) {
                        components.push(
                            new ActionRow({
                                components: component.components.map((row) => {
                                    row.data.disabled = true;
                                    return row.toJSON();
                                }),
                            }),
                        );
                    }

                    await this.ctx.client.messages.edit(this.message!.id, this.message!.channelId, { components }).catch(() => null);
                }
            },
        });

        collector.run(["pagination-pagePrev", "pagination-pageNext"], async (interaction) => {
            if (!interaction.isButton()) return;

            if (interaction.customId === "pagination-pagePrev" && this.pages > 0) --this.pages;
            if (interaction.customId === "pagination-pageNext" && this.pages < this.embeds.length - 1) ++this.pages;

            await interaction.deferUpdate();
            await this.ctx.editOrReply({ embeds: [this.embeds[this.pages]], components: this.getRows() }).catch(() => null);
        });

        if (this.rows.length) {
            collector.run<StelleComponentInteraction>(/./, (interaction) => {
                for (const row of this.rows) {
                    for (const component of row.components) {
                        if ((component.data as { custom_id?: string }).custom_id === interaction.customId) {
                            if (!(component as StelleComponents).run)
                                throw new InvalidComponentRun(`The component: "${interaction.customId}" doesn't have a run function.`);

                            return (component as StelleComponents).run(interaction, async (n) => {
                                if (n < 0 || n >= this.embeds.length) return;

                                this.pages = n;

                                await interaction.deferUpdate();
                                await this.ctx
                                    .editOrReply({ embeds: [this.embeds[this.pages]], components: this.getRows() })
                                    .catch(() => null);
                            });
                        }
                    }
                }
            });
        }
    }

    /**
     * Get the current page of the paginator.
     */
    get currentPage(): number {
        return this.pages + 1;
    }

    /**
     * Get the max pages of the paginator.
     */
    get maxPages(): number {
        return this.embeds.length;
    }

    /**
     *
     * Add a new embed to display.
     * @param embed The embed.
     */
    public addEmbed(embed: Embed): this {
        this.embeds.push(embed);
        return this;
    }

    /**
     *
     * Set a new array of embeds to display.
     * @param embeds The embeds.
     */
    public setEmbeds(embeds: Embed[]): this {
        this.embeds = embeds;
        return this;
    }

    /**
     *
     * Set a new array of rows to display.
     * @param rows The rows.
     * @returns
     */
    public setRows(rows: ActionRow<StelleButton | StelleStringMenu>[]): this {
        this.rows = rows;
        return this;
    }

    /**
     *
     * Set if the pagination buttons are disabled. (Exept the custom rows)
     * @param disabled The disabled.
     * @default false
     * @returns
     */
    public setDisabled(disabled: boolean): this {
        this.disabled = disabled;
        return this;
    }

    /**
     *
     * Set a page to desplay the embed.
     * @param page The page.
     */
    public setPage(page: number): this {
        if (!this.embeds.length) throw new InvalidEmbedsLength("I can't send the pagination without embeds.");
        if (!this.message) throw new InvalidMessage("I can't set the page to an unresponded pagination.");

        if (page > this.embeds.length || page < this.embeds.length)
            throw new InvalidPageNumber(`The page: "${page}" is invalid. There are: "${this.embeds.length}" pages.`);

        this.pages = page - 1;
        this.ctx.editOrReply({
            content: "",
            embeds: [this.embeds[this.pages]],
            components: this.getRows(),
        });

        return this;
    }

    /**
     *
     * Send the embed pagination.
     * @param ephemeral If the message should be ephemeral.
     */
    public async reply(ephemeral: boolean = false): Promise<this> {
        if (!this.embeds.length) throw new InvalidEmbedsLength("I can't send the pagination without embeds.");

        const flags = ephemeral ? MessageFlags.Ephemeral : undefined;

        this.message = await this.ctx.editOrReply(
            {
                content: "",
                embeds: [this.embeds[this.pages]],
                components: this.getRows(),
                flags,
            },
            true,
        );

        await this.createCollector();

        return this;
    }

    /**
     *
     * Edit a current embed paginator.
     * @param body The body.
     * @returns
     */
    public async edit(body: InteractionCreateBodyRequest | InteractionMessageUpdateBodyRequest): Promise<this> {
        if (!this.message) throw new InvalidMessage("I can't set the page to an unresponded pagination.");

        await this.ctx.editOrReply(body);

        return this;
    }

    /**
     *
     * Update the current embed paginator.
     * @returns
     */
    public async update(): Promise<this> {
        if (!this.message) throw new InvalidMessage("I can't set the page to an unresponded pagination.");

        await this.edit({
            content: "",
            embeds: [this.embeds[this.pages]],
            components: this.getRows(),
        });

        return this;
    }
}
