import { Command, type CommandContext, Declare, LocalesT, type User } from "seyfert";
import { StelleOptions } from "#stelle/decorators";
import { StelleCategory } from "#stelle/types";

import { TimeFormat } from "#stelle/utils/TimeFormat.js";
import { createBar } from "#stelle/utils/functions/utils.js";

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
    public override async run(ctx: CommandContext) {
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
                        duration: TimeFormat.toHumanize(track.info.duration),
                        author: track.info.author,
                        position: TimeFormat.toHumanize(player.position),
                        requester: (track.requester as User).id,
                        bar: createBar(player),
                    }),
                },
            ],
        });
    }
}
