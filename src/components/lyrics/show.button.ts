import { ComponentCommand, type GuildComponentContext, Middlewares } from "seyfert";
import { displayLyrics } from "#stelle/utils/functions/manager/lyrics.js";

@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer", "checkTracks"])
export default class LyricsShowComponent extends ComponentCommand {
    override componentType = "Button" as const;
    override customId = "player-lyricsShow";

    async run(ctx: GuildComponentContext<typeof this.componentType>): Promise<void> {
        await displayLyrics(ctx);
    }
}
