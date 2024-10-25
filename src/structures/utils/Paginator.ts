import {
    ActionRow,
    type AnyContext,
    Button,
    type ButtonInteraction,
    type Embed,
    type Message,
    type MessageBuilderComponents,
    type SelectMenuInteraction,
    StringSelectMenu,
    type WebhookMessage,
} from "seyfert";
import {
    type APIButtonComponentWithCustomId,
    type APIStringSelectComponent,
    ButtonStyle,
    ComponentType,
    MessageFlags,
} from "seyfert/lib/types/index.js";

import {
    type Awaitable,
    EmbedColors,
    type InteractionCreateBodyRequest,
    type InteractionMessageUpdateBodyRequest,
} from "seyfert/lib/common/index.js";
import { InvalidEmbedsLength, InvalidMessage, InvalidPageNumber } from "./Errors.js";

/**
 * Stelle button class.
 */
export class StelleButton extends Button {
    /**
     * The function to run when the button is clicked.
     */
    readonly run: (interaction: ButtonInteraction, setPage: (n: number) => void) => Awaitable<unknown>;

    /**
     * The data of the button.
     */
    declare data: APIButtonComponentWithCustomId;

    /**
     * Create a new StelleButton instance.
     * @param component
     */
    constructor({ run, ...data }: Partial<APIButtonComponentWithCustomId> & { run: StelleButton["run"] }) {
        super(data);
        this.run = run;
    }
}

/**
 * Stelle string menu class.
 */
export class StelleStringMenu extends StringSelectMenu {
    /**
     * The function to run when the string menu is clicked.
     */
    readonly run: (interaction: SelectMenuInteraction, setPage: (n: number) => void) => Awaitable<unknown>;

    /**
     * The data of the string menu.
     */
    declare data: StringSelectMenu["data"];

    /**
     * Create a new StelleStringMenu instance.
     * @param component
     */
    constructor({ run, ...data }: Partial<APIStringSelectComponent> & { run: StelleStringMenu["run"] }) {
        super(data);
        this.run = run;
    }
}

type StelleComponents = StelleButton | StelleStringMenu;

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
     * @param options
     */
    constructor(ctx: AnyContext) {
        this.ctx = ctx;
    }

    /**
     *
     * Get the current row of the paginator.
     * @param userId
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
        const { ctx, message } = this;
        const { messages } = await ctx.getLocale();
        const { client } = ctx;

        if (!message) return;

        const collector = message.createComponentCollector({
            idle: 60e3,
            filter: (interaction) => interaction.user.id === ctx.author.id,
            onPass: async (interaction) => {
                await interaction.write({
                    flags: MessageFlags.Ephemeral,
                    embeds: [
                        {
                            description: messages.events.noCollector({ userId: ctx.author.id }),
                            color: EmbedColors.Red,
                        },
                    ],
                });
            },
            onStop: async (reason) => {
                if (reason === "idle") {
                    const row = new ActionRow<Button>().setComponents(
                        message.components[0].components
                            .map((builder) => builder.toJSON())
                            .filter((row) => row.type === ComponentType.Button && row.style !== ButtonStyle.Link)
                            .map((component) => {
                                if ((component as APIButtonComponentWithCustomId).custom_id === "pagination-pagePos")
                                    (component as APIButtonComponentWithCustomId).label = "0/0";
                                return new Button(component as APIButtonComponentWithCustomId).setDisabled(true);
                            }),
                    );

                    await client.messages.edit(message.id, message.channelId, { components: [row] }).catch(() => null);
                }
            },
        });

        collector.run(["pagination-pagePrev", "pagination-pageNext"], async (interaction) => {
            if (!interaction.isButton()) return;

            if (interaction.customId === "pagination-pagePrev" && this.pages > 0) --this.pages;
            if (interaction.customId === "pagination-pageNext" && this.pages < this.embeds.length - 1) ++this.pages;

            await interaction.deferUpdate();
            await ctx.editOrReply({ embeds: [this.embeds[this.pages]], components: this.getRows() }).catch(() => null);
        });

        if (this.rows.length) {
            collector.run(/./, (interaction) => {
                for (const row of this.rows) {
                    for (const component of row.components) {
                        if ((component.data as { custom_id?: string }).custom_id === interaction.customId) {
                            return (component as StelleComponents).run(interaction as any, async (n) => {
                                if (n < 0 || n >= this.embeds.length) return;

                                this.pages = n;

                                await interaction.deferUpdate();
                                await ctx.editOrReply({ embeds: [this.embeds[this.pages]], components: this.getRows() }).catch(() => null);
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
     * @param embed.
     */
    public addEmbed(embed: Embed): this {
        this.embeds.push(embed);
        return this;
    }

    /**
     *
     * Set a new array of embeds to display.
     * @param embeds
     */
    public setEmbeds(embeds: Embed[]): this {
        this.embeds = embeds;
        return this;
    }

    /**
     *
     * Set a new array of rows to display.
     * @param rows
     * @returns
     */
    public setRows(rows: ActionRow<StelleButton | StelleStringMenu>[]): this {
        this.rows = rows;
        return this;
    }

    /**
     *
     * Set if the pagination buttons are disabled. (Exept the custom rows)
     * @default false
     * @param disabled
     * @returns
     */
    public setDisabled(disabled: boolean): this {
        this.disabled = disabled;
        return this;
    }

    /**
     *
     * Set a page to desplay the embed.
     * @param page
     */
    public setPage(page: number): this {
        const { message, ctx } = this;

        if (!this.embeds.length) throw new InvalidEmbedsLength("I can't send the pagination without embeds.");
        if (!message) throw new InvalidMessage("I can't set the page to an unresponded pagination.");

        if (page > this.embeds.length || page < this.embeds.length)
            throw new InvalidPageNumber(`The page: "${page}" is invalid. There are: "${this.embeds.length}" pages.`);

        this.pages = page - 1;

        ctx.editOrReply({
            content: "",
            embeds: [this.embeds[this.pages]],
            components: this.getRows(),
        });

        return this;
    }

    /**
     *
     * Send the embed pagination.
     * @param ephemeral
     */
    public async reply(ephemeral: boolean = false): Promise<this> {
        const { ctx } = this;

        if (!this.embeds.length) throw new InvalidEmbedsLength("I can't send the pagination without embeds.");

        const flags = ephemeral ? MessageFlags.Ephemeral : undefined;

        this.message = await ctx.editOrReply(
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
     * @param body
     * @returns
     */
    public async edit(body: InteractionCreateBodyRequest | InteractionMessageUpdateBodyRequest): Promise<this> {
        const { message, ctx } = this;
        if (!message) throw new InvalidMessage("I can't set the page to an unresponded pagination.");

        await ctx.editOrReply(body);

        return this;
    }

    /**
     *
     * Update the current embed paginator.
     * @param reset
     * @returns
     */
    public async update(): Promise<this> {
        const { message } = this;
        if (!message) throw new InvalidMessage("I can't set the page to an unresponded pagination.");

        await this.edit({
            content: "",
            embeds: [this.embeds[this.pages]],
            components: this.getRows(),
        });

        return this;
    }
}
