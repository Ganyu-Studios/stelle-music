import { type AnyContext, createMiddleware, type Guild, type GuildMember, type MiddlewareContext } from "seyfert";

/**
 * Check if the command is only for developers or guild owner.
 * @type {MiddlewareContext<void, AnyContext>}
 */
export const checkVerifications: MiddlewareContext<void, AnyContext> = createMiddleware<void>(async ({ context, next, stop }) => {
    const { client, author, command } = context;
    const { developerIds } = client.config;

    const { messages } = await context.locale();

    if (command.onlyDeveloper && !developerIds.includes(author.id)) {
        await context.errorReply(messages.events.onlyDeveloper, { ephemeral: true });

        return stop();
    }

    if (command.onlyGuildOwner && context.inGuild()) {
        const guild: Guild<"cached" | "api"> = await context.guild();
        const owner: GuildMember | null = await guild.fetchOwner().catch(() => null);

        if (!owner || owner.id !== author.id) {
            await context.errorReply(messages.events.onlyGuildOwner, { ephemeral: true });

            return stop();
        }

        return next();
    }

    return next();
});
