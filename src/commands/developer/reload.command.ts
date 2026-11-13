import { Command, type CommandContext, Declare } from "seyfert";
import { ApplicationIntegrationType, InteractionContextType, PermissionFlagsBits } from "seyfert/lib/types/index.js";
import { StelleOptions } from "#stelle/utils/decorator.js";

@Declare({
    name: "reload",
    description: "Reload Stelle.",
    defaultMemberPermissions: [PermissionFlagsBits.ManageGuild, PermissionFlagsBits.Administrator],
    integrationTypes: [ApplicationIntegrationType.GuildInstall],
    contexts: [InteractionContextType.Guild],
})
@StelleOptions({ onlyDeveloper: true })
export default class ReloadCommand extends Command {
    public override async run(ctx: CommandContext): Promise<void> {
        await ctx.deferReply(true);
        await ctx.client
            .reload()
            .then((): Promise<void> => ctx.successReply(`\`✅\` ${ctx.client.me.username} has been reloaded.`, { content: "" }))
            .catch((): Promise<void> => ctx.errorReply("`❌` Something failed during the reload.", { content: "" }));
    }
}
