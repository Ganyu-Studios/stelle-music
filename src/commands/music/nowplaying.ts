import { Command, type CommandContext, Declare, LocalesT, Middlewares, type User } from "seyfert";
import { StelleOptions } from "#stelle/decorators";
import { StelleCategory } from "#stelle/types";

import { EmbedColors } from "seyfert/lib/common/index.js";
import { TimeFormat } from "#stelle/utils/TimeFormat.js";
import { createBar } from "#stelle/utils/functions/utils.js";

@Declare({
    name: "nowplaying",
    description: "Get the current playing song.",
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"],
    aliases: ["np"],
})
@StelleOptions({ cooldown: 5, category: StelleCategory.Music })
@LocalesT("locales.nowplaying.name", "locales.nowplaying.description")
@Middlewares(["checkNodes", "checkPlayer"])
export default class NowPlayingCommand extends Command {
    public override async run(ctx: CommandContext) {
        const { client, guildId } = ctx;

        if (!guildId) return;

        const { messages } = await ctx.getLocale();

        const player = client.manager.getPlayer(guildId);
        if (!player) return;

        const track = player.queue.current;
        if (!track)
            return ctx.editOrReply({
                embeds: [
                    {
                        description: messages.events.noPlayer,
                        color: EmbedColors.Red,
                    },
                ],
            });

        await ctx.editOrReply({
            embeds: [
                {
                    thumbnail: { url: track.info.artworkUrl ?? "" },
                    color: client.config.color.success,
                    description: messages.commands.nowplaying({
                        title: track.info.title,
                        url: track.info.uri,
                        duration: TimeFormat.toDotted(track.info.duration),
                        author: track.info.author,
                        position: TimeFormat.toDotted(player.position),
                        requester: (track.requester as User).id,
                        bar: createBar(player),
                    }),
                },
            ],
        });
    }
}
