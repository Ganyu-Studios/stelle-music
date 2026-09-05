import { Command, Declare, type GuildCommandContext, LocalesT, Middlewares } from "seyfert";
import { ApplicationIntegrationType, InteractionContextType } from "seyfert/lib/types/index.js";
import { StelleCategory } from "#stelle/types";
import { StelleOptions } from "#stelle/utils/decorator.js";
import { displayLyrics } from "#stelle/utils/functions/manager/lyrics.js";

@Declare({
    name: "lyrics",
    description: "Show lyrics for the current track.",
    integrationTypes: [ApplicationIntegrationType.GuildInstall],
    contexts: [InteractionContextType.Guild],
    aliases: ["lyric", "ly"],
})
@StelleOptions({ cooldown: 5, category: StelleCategory.Music })
@LocalesT("locales.lyrics.name", "locales.lyrics.description")
@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer"])
export default class LyricsCommand extends Command {
    public override async run(ctx: GuildCommandContext): Promise<void> {
        await displayLyrics(ctx);
    }
}
