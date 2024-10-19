import {
    ActionRow,
    type AnyContext,
    Button,
    type ComponentContext,
    type ContextComponentCommandInteractionMap,
    type Embed,
    type Message,
    type MessageBuilderComponents,
    type WebhookMessage,
} from "seyfert";
import { type APIButtonComponentWithCustomId, ButtonStyle, ComponentType, MessageFlags } from "seyfert/lib/types/index.js";

import {
    type Awaitable,
    EmbedColors,
    type InteractionCreateBodyRequest,
    type InteractionMessageUpdateBodyRequest,
} from "seyfert/lib/common/index.js";
import { InvalidEmbedsLength, InvalidMessage, InvalidPageNumber } from "./Errors.js";

interface ComponentOptions<T extends keyof ContextComponentCommandInteractionMap> {
    customId: string;
    type: T;
    run: (ctx: ComponentContext<T>) => Awaitable<any>;
}

export interface EmbedPaginatorOptions {
    ctx: AnyContext;
    rows?: ActionRow<MessageBuilderComponents>[];
}

export class Component<T extends keyof ContextComponentCommandInteractionMap> {
    readonly customId: string;
    readonly type: T;

    public run: (ctx: ComponentContext<T>) => Awaitable<any>;

    constructor(component: ComponentOptions<T>) {
        this.customId = component.customId;
        this.type = component.type;
        this.run = component.run;
    }
}

/**
 * Main Stelle paginator class.
 */
export class EmbedPaginator {
    readonly pages: Record<string, number> = {};
    readonly userId: string;

    private embeds: Embed[] = [];
    private message: Message | WebhookMessage | null = null;
    private ctx: AnyContext;
    private rows?: EmbedPaginatorOptions["rows"];

    /**
     *
     * Create a new EmbedPagination instance.
     * @param ctx
     */
    constructor(options: EmbedPaginatorOptions) {
        this.ctx = options.ctx;
        this.userId = options.ctx.author.id;
        this.rows = options.rows;
    }

    /**
     *
     * Get the current row of the paginator.
     * @param userId
     * @returns
     */
    private getRows(userId: string): ActionRow<MessageBuilderComponents>[] {
        const rows: ActionRow<MessageBuilderComponents>[] = [
            new ActionRow<MessageBuilderComponents>().addComponents(
                new Button()
                    .setEmoji("<:forward:1061798317417312306>")
                    .setStyle(ButtonStyle.Secondary)
                    .setCustomId("pagination-pagePrev")
                    .setDisabled(this.pages[userId] === 0),
                new Button()
                    .setLabel(`${this.currentPage}/${this.maxPages}`)
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(true)
                    .setCustomId("pagination-pagePos"),
                new Button()
                    .setEmoji("<:next:1061798311671103528>")
                    .setStyle(ButtonStyle.Secondary)
                    .setCustomId("pagination-pageNext")
                    .setDisabled(this.pages[userId] === this.embeds.length - 1),
            ),
        ];

        if (this.rows) rows.unshift(...this.rows);

        return rows;
    }

    /**
     *
     * Create the component collector.
     * @returns
     */
    private async createCollector() {
        const { ctx, pages, embeds, message, userId } = this;
        const { messages } = await ctx.getLocale();
        const { client } = ctx;

        if (!message) return;

        const collector = message.createComponentCollector({
            idle: 60000,
            filter: async (interaction) => {
                if (interaction.user.id !== userId) {
                    await interaction.write({
                        flags: MessageFlags.Ephemeral,
                        embeds: [
                            {
                                description: messages.events.noCollector({ userId }),
                                color: EmbedColors.Red,
                            },
                        ],
                    });

                    return false;
                }

                return true;
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

            if (interaction.customId === "pagination-pagePrev" && pages[userId] > 0) --pages[userId];
            if (interaction.customId === "pagination-pageNext" && pages[userId] < embeds.length - 1) ++pages[userId];

            await interaction.deferUpdate();
            await ctx.editOrReply({ embeds: [embeds[pages[userId]]], components: this.getRows(userId) }).catch(() => null);
        });

        collector.run(/./, () => {});
    }

    /**
     * Get the current page of the paginator.
     */
    get currentPage(): number {
        return this.pages[this.userId] + 1;
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
     * Set a page to desplay the embed.
     * @param page
     */
    public setPage(page: number): this {
        const { message, embeds, pages, ctx, userId } = this;

        if (!embeds.length) throw new InvalidEmbedsLength("I can't send the pagination without embeds.");
        if (!message) throw new InvalidMessage("I can't set the page to an unresponded pagination.");

        if (page > embeds.length || page < embeds.length)
            throw new InvalidPageNumber(`The page: "${page}" is invalid. There are: "${embeds.length}" pages.`);

        pages[userId] = page - 1;

        ctx.editOrReply({
            content: "",
            embeds: [embeds[pages[userId]]],
            components: this.getRows(userId),
        });

        return this;
    }

    /**
     *
     * Send the embed pagination.
     * @param ephemeral
     */
    public async reply(ephemeral: boolean = false): Promise<this> {
        const { ctx, pages, embeds, userId } = this;

        const flags = ephemeral ? MessageFlags.Ephemeral : undefined;

        pages[userId] = pages[userId] ?? 0;

        this.message = await ctx.editOrReply(
            {
                content: "",
                embeds: [embeds[pages[userId]]],
                components: this.getRows(userId),
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
}
