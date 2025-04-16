import {
    Command,
    Declare,
    Embed,
    type GuildCommandContext,
    LocalesT,
    type Message,
    Middlewares,
    type User,
    type WebhookMessage,
} from "seyfert";
import { StelleCategory } from "#stelle/types";
import { StelleOptions } from "#stelle/utils/decorator.js";

import { EmbedColors } from "seyfert/lib/common/index.js";
import { TimeFormat } from "#stelle/utils/functions/time.js";
import { createBar } from "#stelle/utils/functions/utils.js";

@Declare({
    name: "nowplaying",
    description: "Get the current playing track.",
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"],
    aliases: ["np"],
})
@StelleOptions({ cooldown: 5, category: StelleCategory.Music })
@LocalesT("locales.nowplaying.name", "locales.nowplaying.description")
@Middlewares(["checkNodes", "checkPlayer"])
export default class NowPlayingCommand extends Command {
    public override async run(ctx: GuildCommandContext): Promise<Message | WebhookMessage | void> {
        const { client } = ctx;

        const { messages } = await ctx.getLocale();

        const player = client.manager.getPlayer(ctx.guildId);
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

        const embed = new Embed()
            .setThumbnail(track.info.artworkUrl ?? undefined)
            .setColor(client.config.color.success)
            .setDescription(
                messages.commands.nowplaying({
                    title: track.info.title,
                    url: track.info.uri,
                    duration: TimeFormat.toDotted(track.info.duration),
                    author: track.info.author,
                    position: TimeFormat.toDotted(player.position),
                    requester: (track.requester as User).id,
                    bar: createBar(player),
                }),
            );

        await ctx.editOrReply({ embeds: [embed] });
    }
}
