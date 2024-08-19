import { Declare, Command, type CommandContext, type User, LocalesT } from "seyfert";
import { StelleOptions } from "#stelle/decorators";
import { StelleCategory } from "#stelle/types";

import { createBar, msParser } from "#stelle/utils/functions/utils.js";

@Declare({
    name: "nowplaying",
    description: "Get the current playing song.",
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"],
    aliases: ["np"],
})
@StelleOptions({ cooldown: 5, category: StelleCategory.Music, checkNodes: true, checkPlayer: true })
@LocalesT("locales.nowplaying.name", "locales.nowplaying.description")
export default class NowPlayingCommand extends Command {
    async run(ctx: CommandContext) {
        const { client, guildId } = ctx;

        if (!guildId) return;

        const { messages } = await ctx.getLocale();

        const player = client.manager.getPlayer(guildId);
        if (!player) return;

        const track = player.queue.current;
        if (!track) return;

        await ctx.editOrReply({
            embeds: [
                {
                    thumbnail: { url: track.info.artworkUrl ?? "" },
                    color: client.config.color.success,
                    description: messages.commands.nowplaying({
                        title: track.info.title,
                        url: track.info.uri,
                        duration: msParser(track.info.duration),
                        author: track.info.author,
                        position: msParser(player.position),
                        requester: (track.requester as User).id,
                        bar: createBar(player),
                    })
                }
            ]
        });
    }
}
