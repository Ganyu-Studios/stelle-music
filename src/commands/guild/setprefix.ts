import { type CommandContext, createStringOption, LocalesT, Command, Declare, Options } from "seyfert";
import { StelleOptions } from "#stelle/decorators";
import { StelleCategory } from "#stelle/types";

const cmdOptions = {
    prefix: createStringOption({
        description: "Enter the new prefix.",
        required: true,
        locales: {
            name: "locales.setprefix.option.name",
            description: "locales.setprefix.option.description"
        }
    })
};

@Declare({
    name: "setprefix",
    description: "Set the prefix of Stelle.",
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"],
    defaultMemberPermissions: ["ManageGuild"]
})
@StelleOptions({
    cooldown: 10,
    category: StelleCategory.Guild
})
@LocalesT("locales.setprefix.name", "locales.setprefix.description")
@Options(cmdOptions)
export default class SetlangCommand extends Command {
    public override async run(ctx: CommandContext<typeof cmdOptions>) {
        const { client, options } = ctx;
        const { prefix } = options;

        if (!ctx.guildId) {
            return;
        }

        const { messages } = await ctx.getLocale();

        await client.database.setPrefix(ctx.guildId, prefix);
        await ctx.editOrReply({
            embeds: [
                {
                    description: messages.commands.setprefix({ prefix }),
                    color: client.config.color.success
                }
            ]
        });
    }
}
