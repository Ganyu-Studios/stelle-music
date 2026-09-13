import { Command, createStringOption, Declare, type GuildCommandContext, LocalesT, Options } from "seyfert";
import { ApplicationIntegrationType, InteractionContextType, PermissionFlagsBits } from "seyfert/lib/types/index.js";
import { StelleCategory } from "#stelle/types";
import { StelleOptions } from "#stelle/utils/decorator.js";

const options = {
    prefix: createStringOption({
        description: "Enter the new prefix.",
        required: true,
        locales: {
            name: "locales.setprefix.option.name",
            description: "locales.setprefix.option.description",
        },
    }),
};

@Declare({
    name: "setprefix",
    description: "Set the prefix of Stelle.",
    integrationTypes: [ApplicationIntegrationType.GuildInstall],
    contexts: [InteractionContextType.Guild],
    defaultMemberPermissions: [PermissionFlagsBits.ManageGuild],
})
@StelleOptions({ cooldown: 10, category: StelleCategory.Guild })
@LocalesT("locales.setprefix.name", "locales.setprefix.description")
@Options(options)
export default class SetPrefixCommand extends Command {
    public override async run(ctx: GuildCommandContext<typeof options>): Promise<void> {
        const { client, options } = ctx;
        const { prefix } = options;

        const { messages } = await ctx.locale();

        await client.database.prefixes.set(ctx.guildId, prefix);
        await ctx.successReply(messages.commands.setprefix({ prefix }));
    }
}
