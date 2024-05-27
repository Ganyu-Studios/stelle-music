import { type APIButtonComponent, ButtonStyle, ComponentType, MessageFlags } from "discord-api-types/v10";
import { ActionRow, Button, type Embed, type Message, type WebhookMessage } from "seyfert";
import type { AnyContext } from "#stelle/types";

import { EmbedColors, type InteractionCreateBodyRequest, type InteractionMessageUpdateBodyRequest } from "seyfert/lib/common/index.js";
import { InvalidEmbedsLength, InvalidMessage, InvalidPageNumber } from "./Errors.js";

type Pages = { [userId: string]: number };

export class EmbedPaginator {
    private ctx: AnyContext;
    private pages: Pages;
    private embeds: Embed[];

    private message: Message | WebhookMessage | null;

    /**
     *
     * Create a new EmbedPagination instance.
     * @param ctx
     */
    constructor(ctx: AnyContext) {
        this.ctx = ctx;
        this.message = null;

        this.pages = {};
        this.embeds = [];
    }

    /**
     *
     * Get the current row of the paginator.
     * @param userId
     * @returns
     */
    private getRow(userId: string): ActionRow<Button> {
        const { pages, embeds } = this;

        const row = new ActionRow<Button>().addComponents(
            new Button()
                .setEmoji("<:forward:1061798317417312306>")
                .setStyle(ButtonStyle.Secondary)
                .setCustomId("pagination-pagePrev")
                .setDisabled(pages[userId] === 0),
            new Button()
                .setLabel(`${this.currentPage}/${this.maxPages}`)
                .setStyle(ButtonStyle.Primary)
                .setDisabled(true)
                .setCustomId("pagination-pagePos"),
            new Button()
                .setEmoji("<:next:1061798311671103528>")
                .setStyle(ButtonStyle.Secondary)
                .setCustomId("pagination-pageNext")
                .setDisabled(pages[userId] === embeds.length - 1),
        );

        return row;
    }

    /**
     *
     * Create the component collector.
     * @returns
     */
    private async createCollector() {
        const { ctx, pages, embeds, message } = this;
        const { messages } = ctx.t.get(await ctx.getLocale());
        const { client } = ctx;

        if (!message) return;

        const userId = ctx.author.id;
        const collector = message.createComponentCollector({
            idle: 60000,
            filter: async (interaction) => {
                if (interaction.user.id !== ctx.author.id) {
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
                    if (!message) return;

                    const row = new ActionRow<Button>().setComponents(
                        message.components[0].components
                            .map((builder) => builder.toJSON())
                            .filter((row) => row.type === ComponentType.Button)
                            .map((component) => {
                                if ((component as APIButtonComponent).label) (component as APIButtonComponent).label = "0/0";
                                return new Button(component as APIButtonComponent).setDisabled(true);
                            }),
                    );

                    await client.messages.edit(message.id, message.channelId, { components: [row] }).catch(() => {});
                }
            },
        });

        collector.run("pagination-pagePrev", async (interaction) => {
            if (!interaction.isButton()) return;
            if (pages[userId] > 0) --pages[userId];
            await interaction.deferUpdate();
            await ctx.editOrReply({ embeds: [embeds[pages[userId]]], components: [this.getRow(userId)] }).catch(() => {});
        });

        collector.run("pagination-pageNext", async (interaction) => {
            if (!interaction.isButton()) return;
            if (pages[userId] < embeds.length - 1) ++pages[userId];

            await interaction.deferUpdate();
            await ctx.editOrReply({ embeds: [embeds[pages[userId]]], components: [this.getRow(userId)] }).catch(() => {});
        });
    }

    /**
     * Get the current page of the paginator.
     */
    get currentPage(): number {
        return this.pages[this.ctx.author.id] + 1;
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
        const { message, embeds, pages, ctx } = this;

        if (!embeds.length) throw new InvalidEmbedsLength("I can't send the pagination without embeds.");
        if (!message) throw new InvalidMessage("I can't set the page to an unresponded pagination.");

        if (page > embeds.length) throw new InvalidPageNumber(`The page "${page}" exceeds the limit of "${embeds.length}" pages.`);

        const userId = ctx.author.id;

        pages[userId] = page - 1;

        ctx.editOrReply({
            content: "",
            embeds: [embeds[pages[userId]]],
            components: [this.getRow(userId)],
        });

        return this;
    }

    /**
     *
     * Send the embed pagination.
     * @param ephemeral
     */
    public async reply(ephemeral: boolean = false): Promise<this> {
        const { ctx, pages, embeds } = this;

        const flags = ephemeral ? MessageFlags.Ephemeral : undefined;
        const userId = ctx.author.id;

        pages[userId] = pages[userId] ?? 0;

        this.message = await ctx.editOrReply(
            {
                content: "",
                embeds: [embeds[pages[userId]]],
                components: [this.getRow(userId)],
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
