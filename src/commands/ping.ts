import { type CommandContext, Declare } from "seyfert";
import { StelleCommand } from "#stelle/classes";

@Declare({
    name: "ping",
    description: "Get the Stelle ping.",
})
export default class PingCommand extends StelleCommand {
    async run(ctx: CommandContext) {
        //for now this is an example.
        await ctx.editOrReply({
            content: "ping!",
        });
    }
}
