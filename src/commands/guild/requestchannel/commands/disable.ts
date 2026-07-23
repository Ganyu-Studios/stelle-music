import { Declare, type GuildCommandContext, LocalesT, SubCommand } from "seyfert";

@Declare({
    name: "disable",
    description: "Disable the song request channel.",
})
@LocalesT("locales.requestchannel.commands.disable.name", "locales.requestchannel.commands.disable.description")
export default class DisableRequestChannelSubCommand extends SubCommand {
    public async run(ctx: GuildCommandContext): Promise<void> {
        const { client, guildId } = ctx;
        const { messages } = await ctx.locale();

        const config = await client.database.requests.get(guildId);
        if (!config) return ctx.errorReply(messages.commands.requestchannel.alreadyDisabled, { ephemeral: true, content: "" });

        await client.database.requests.delete(guildId);
        await client.messages.delete(config.messageId, config.channelId).catch((): null => null);

        await ctx.successReply(messages.commands.requestchannel.disabled, { ephemeral: true, content: "" });
    }
}
