import { AttachmentBuilder, Command, type CommandContext, Declare } from "seyfert";
import { ApplicationIntegrationType, InteractionContextType, PermissionFlagsBits } from "seyfert/lib/types/index.js";
import { StelleOptions } from "#stelle/utils/decorator.js";
import { ImageOps } from "#stelle/utils/functions/internal/image.js";

@Declare({
    name: "test",
    description: "A test command to test things.",
    integrationTypes: [ApplicationIntegrationType.GuildInstall],
    contexts: [InteractionContextType.Guild],
    defaultMemberPermissions: [PermissionFlagsBits.Administrator],
})
@StelleOptions({ onlyDeveloper: true, skipRegister: false })
export default class TestCommand extends Command {
    override async run(ctx: CommandContext) {
        const player = ctx.getPlayer();

        const current = player?.queue.current ?? undefined;

        const banner = await ImageOps.banner({
            albumURL: current?.info.artworkUrl ?? undefined,
            artist: current?.info.author ?? "Unknown Artist",
            name: current?.info.title ?? "Unknown Track",
        });

        const attachment = new AttachmentBuilder().setFile("buffer", banner).setName("banner.png");

        await ctx.editOrReply({ files: [attachment] });
    }
}
