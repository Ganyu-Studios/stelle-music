import { createChannelOption, Declare, type GuildCommandContext, LocalesT, type MessageStructure, Options, SubCommand } from "seyfert";
import { ChannelType } from "seyfert/lib/types/index.js";
import { buildPanel } from "#stelle/utils/functions/manager/panel.js";

const options = {
    channel: createChannelOption({
        description: "The channel to use. If omitted, a new one is created.",
        required: false,
        channel_types: [ChannelType.GuildText],
        locales: {
            name: "locales.requestchannel.commands.set.options.channel.name",
            description: "locales.requestchannel.commands.set.options.channel.description",
        },
    }),
};

@Declare({
    name: "set",
    description: "Set (or create) the song request channel.",
})
@LocalesT("locales.requestchannel.commands.set.name", "locales.requestchannel.commands.set.description")
@Options(options)
export default class SetRequestChannelSubCommand extends SubCommand {
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

            if (!created) return ctx.errorReply(messages.commands.requestchannel.createFailed, { ephemeral: true, content: "" });

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
            if (!panel) return ctx.errorReply(messages.commands.requestchannel.postFailed, { ephemeral: true, content: "" });

            messageId = panel.id;
        }

        await client.database.requests.set(guildId, { channelId, messageId });

        await ctx.successReply(messages.commands.requestchannel.set({ channelId }), { ephemeral: true, content: "" });
    }
}
