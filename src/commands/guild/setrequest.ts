import { Command, Declare, type GuildCommandContext, LocalesT, Options, createChannelOption } from "seyfert";
import { StelleOptions } from "#stelle/utils/decorator.js";

import { EmbedColors } from "seyfert/lib/common/index.js";
import { ChannelType, MessageFlags } from "seyfert/lib/types/index.js";
import { StelleCategory } from "#stelle/types";

const options = {
    channel: createChannelOption({
        description: "Select the text channel.",
        channel_types: [ChannelType.GuildText],
        locales: {
            name: "locales.setrequest.option.name",
            description: "locales.setrequest.option.description",
        },
    }),
};

@Declare({
    name: "setrequest",
    description: "Set the request channel of Stelle.",
    aliases: ["request", "rq"],
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"],
    defaultMemberPermissions: ["ManageGuild"],
})
@StelleOptions({ cooldown: 10, category: StelleCategory.Guild })
@LocalesT("locales.setrequest.name", "locales.setrequest.description")
@Options(options)
export default class SetRequestCommand extends Command {
    override async run(ctx: GuildCommandContext<typeof options>) {
        const { client, options } = ctx;

        const channel = options.channel ?? (await ctx.channel());
        if (!channel.isTextGuild())
            return ctx.editOrReply({
                flags: MessageFlags.Ephemeral,
                embeds: [
                    {
                        description: "The channel must be a text channel.",
                        color: EmbedColors.Red,
                    },
                ],
            });

        await client.database.setRequest(ctx.guildId, { channelId: channel.id });
        await client.manager.setDefaultEmbed(ctx.guildId);

        await ctx.editOrReply({
            flags: MessageFlags.Ephemeral,
            embeds: [
                {
                    description: `The request channel has been set to <#${channel.id}>.`,
                    color: client.config.color.success,
                },
            ],
        });
    }
}
