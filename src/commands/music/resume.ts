import type { PlayerStructure } from "hoshimi";
import {
    Command,
    Declare,
    type GuildCommandContext,
    LocalesT,
    type MessageStructure,
    Middlewares,
    type WebhookMessageStructure,
} from "seyfert";
import { EmbedColors } from "seyfert/lib/common/index.js";
import { ApplicationIntegrationType, InteractionContextType } from "seyfert/lib/types/index.js";
import { StelleCategory } from "#stelle/types";
import { StelleOptions } from "#stelle/utils/decorator.js";

@Declare({
    name: "resume",
    description: "Resume the player.",
    integrationTypes: [ApplicationIntegrationType.GuildInstall],
    contexts: [InteractionContextType.Guild],
    aliases: ["unpause", "play"],
})
@StelleOptions({ cooldown: 5, category: StelleCategory.Music })
@LocalesT("locales.resume.name", "locales.resume.description")
@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer"])
export default class ResumeCommand extends Command {
    public override async run(ctx: GuildCommandContext): Promise<WebhookMessageStructure | MessageStructure | void> {
        const { client } = ctx;

        const { messages } = await ctx.locale();

        const player: PlayerStructure | undefined = client.manager.getPlayer(ctx.guildId);
        if (!player) return;

        if (!player.paused)
            return ctx.editOrReply({
                embeds: [
                    {
                        description: messages.commands.resume.alreadyPlaying,
                        color: EmbedColors.Red,
                    },
                ],
            });

        await player.setPaused(false);
        await ctx.editOrReply({
            embeds: [
                {
                    description: messages.commands.resume.success,
                    color: client.config.color.success,
                },
            ],
        });
    }
}
