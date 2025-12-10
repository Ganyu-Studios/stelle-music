import { Command, type CommandContext, Declare, type Message, type WebhookMessage } from "seyfert";
import { EmbedColors } from "seyfert/lib/common/index.js";
import { StelleOptions } from "#stelle/utils/decorator.js";

@Declare({
    name: "reload",
    description: "Reload Stelle.",
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
            .then(
                (): Promise<Message | WebhookMessage | void> =>
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
            .catch(
                (): Promise<Message | WebhookMessage | void> =>
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
