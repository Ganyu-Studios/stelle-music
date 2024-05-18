import type { CommandContext } from "seyfert";
import { StelleCommand } from "#stelle/classes";

export default class PingCommand extends StelleCommand {
    async run(ctx: CommandContext) {
        //for now this is an example.
        await ctx.editOrReply({
            content: "ping!",
        });
    }
}
