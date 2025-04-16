import { Command, Declare, type GuildCommandContext, LocalesT, Options, createStringOption } from "seyfert";
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
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"],
    defaultMemberPermissions: ["ManageGuild"],
})
@StelleOptions({ cooldown: 10, category: StelleCategory.Guild })
@LocalesT("locales.setprefix.name", "locales.setprefix.description")
@Options(options)
export default class SetlangCommand extends Command {
    public override async run(ctx: GuildCommandContext<typeof options>): Promise<void> {
        const { client, options } = ctx;
        const { prefix } = options;

        const { messages } = await ctx.getLocale();

        await client.database.setPrefix(ctx.guildId, prefix);
        await ctx.editOrReply({
            embeds: [
                {
                    description: messages.commands.setprefix({ prefix }),
                    color: client.config.color.success,
                },
            ],
        });
    }
}
