import { Command, type CommandContext, Declare } from "seyfert";
import { StelleOptions } from "#stelle/decorators";

import { EmbedColors } from "seyfert/lib/common/index.js";
import { Configuration } from "#stelle/data/configuration/index.js";

@Declare({
    name: "reload",
    description: "Reload Stelle.",
    guildId: Configuration.guildIds,
    defaultMemberPermissions: ["ManageGuild", "Administrator"],
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"],
})
@StelleOptions({ onlyDeveloper: true })
export default class ReloadCommand extends Command {
    public override async run(ctx: CommandContext): Promise<void> {
        await ctx.deferReply(true);
        await ctx.client
            .reload()
            .then(() =>
                ctx.editOrReply({
                    content: "",
                    embeds: [
                        {
                            description: "`✅` Stelle has been reloaded.",
                            color: ctx.client.config.color.success,
                        },
                    ],
                }),
            )
            .catch(() =>
                ctx.editOrReply({
                    content: "",
                    embeds: [
                        {
                            description: "`❌` Something failed during the reload.",
                            color: EmbedColors.Red,
                        },
                    ],
                }),
            );
    }
}
