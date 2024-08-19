import { Declare, Command, type CommandContext } from "seyfert";
import { StelleOptions } from "#stelle/decorators";

import { Configuration } from "#stelle/data/Configuration.js";
import { StelleCategory } from "#stelle/types";

@Declare({
    name: "help",
    description: "Get help for a command",
    guildId: Configuration.guildIds,
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"],
})
@StelleOptions({ cooldown: 5, category: StelleCategory.User })
export default class ExampleCommand extends Command {
    async run(ctx: CommandContext) {
        await ctx.editOrReply({ content: "pong!" });
    }    
}
