import { Declare, Command, type CommandContext } from "seyfert";
import { StelleOptions } from "#stelle/decorators";

import { Configuration } from "#stelle/data/Configuration.js";
import { StelleCategory } from "#stelle/types";

@Declare({
    name: "help",
    description: "The most useful command in the world!",
    guildId: Configuration.guildIds,
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"],
})
@StelleOptions({ category: StelleCategory.User, cooldown: 5 })
export default class HelpCommand extends Command {
    public override async run(ctx: CommandContext) {
        await ctx.editOrReply({ content: "pong!" });
    }
}
