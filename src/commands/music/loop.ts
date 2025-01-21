import { Command, Declare, type GuildCommandContext, LocalesT, Middlewares, Options, createStringOption } from "seyfert";
import { StelleOptions } from "#stelle/decorators";

import type { RepeatMode } from "lavalink-client";

import { StelleCategory } from "#stelle/types";
import { getLoopState } from "#stelle/utils/functions/utils.js";

const options = {
    mode: createStringOption({
        description: "Select the loop mode.",
        required: true,
        choices: [
            {
                name: "Off",
                value: "off",
            },
            {
                name: "Track",
                value: "track",
            },
            {
                name: "Queue",
                value: "queue",
            },
        ],
        locales: {
            name: "locales.loop.option.name",
            description: "locales.loop.option.description",
        },
    }),
};

@Declare({
    name: "loop",
    description: "Toggle the loop mode.",
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"],
    aliases: ["l"],
})
@StelleOptions({ cooldown: 5, category: StelleCategory.Music })
@Options(options)
@LocalesT("locales.loop.name", "locales.loop.description")
@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer"])
export default class LoopCommand extends Command {
    public override async run(ctx: GuildCommandContext<typeof options>) {
        const { client, options } = ctx;
        const { mode } = options;

        const { messages } = await ctx.getLocale();

        const player = client.manager.getPlayer(ctx.guildId);
        if (!player) return;

        await player.setRepeatMode(mode as RepeatMode);
        await ctx.editOrReply({
            embeds: [
                {
                    color: client.config.color.success,
                    description: messages.commands.autoplay.toggled({
                        type: messages.commands.loop.loopType[getLoopState(player.repeatMode, true)],
                    }),
                },
            ],
        });
    }
}
