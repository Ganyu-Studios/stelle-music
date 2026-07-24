import { createChannelOption, Declare, type GuildCommandContext, LocalesT, type MessageStructure, Options, SubCommand } from "seyfert";
import { ChannelType } from "seyfert/lib/types/index.js";
import { buildPanel } from "#stelle/utils/functions/manager/panel.js";

const options = {
    channel: createChannelOption({
        description: "The channel to use. If omitted, a new one is created.",
        required: false,
        channel_types: [ChannelType.GuildText],
        locales: {
            name: "locales.setrequest.commands.setup.options.channel.name",
            description: "locales.setrequest.commands.setup.options.channel.description",
        },
    }),
};

@Declare({
    name: "setup",
    description: "Set up (or create) the song request channel.",
})
@LocalesT("locales.setrequest.commands.setup.name", "locales.setrequest.commands.setup.description")
@Options(options)
export default class SetupRequestSubCommand extends SubCommand {
    public async run(ctx: GuildCommandContext<typeof options>): Promise<void> {
        const { client, guildId } = ctx;
        const { messages } = await ctx.locale();

        const target = ctx.options.channel;

        let channelId: string;
        let messageId: string | undefined;

        if (target) {
            channelId = target.id;
        } else {
            const guild = await ctx.guild();
            const created = await guild.channels.create({ name: "stelle-requests", type: ChannelType.GuildText }).catch((): null => null);

            if (!created) return ctx.errorReply(messages.commands.setrequest.createFailed, { ephemeral: true, content: "" });

            channelId = created.id;
        }

        const body = await buildPanel(client, messages);
        const existing = await client.database.requests.get(guildId);

        if (existing && existing.channelId === channelId) {
            const edited = await client.messages.edit(existing.messageId, channelId, body).catch((): null => null);
            if (edited) messageId = edited.id;
        }

        if (!messageId) {
            if (existing) client.messages.delete(existing.messageId, existing.channelId).catch((): null => null);

            const panel: MessageStructure | null = await client.messages.write(channelId, body).catch((): null => null);
            if (!panel) return ctx.errorReply(messages.commands.setrequest.postFailed, { ephemeral: true, content: "" });

            messageId = panel.id;
        }

        await client.database.requests.set(guildId, { channelId, messageId });

        await ctx.successReply(messages.commands.setrequest.set({ channelId }), { ephemeral: true, content: "" });
    }
}
