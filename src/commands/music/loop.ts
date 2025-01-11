import type { RepeatMode } from "lavalink-client";

import { type CommandContext, createStringOption, Middlewares, LocalesT, Command, Declare, Options } from "seyfert";
import { getLoopState } from "#stelle/utils/functions/utils.js";
import { StelleOptions } from "#stelle/decorators";
import { StelleCategory } from "#stelle/types";

const cmdOptions = {
    mode: createStringOption({
        description: "Select the loop mode.",
        required: true,
        choices: [
            {
                name: "Off",
                value: "off"
            },
            {
                name: "Track",
                value: "track"
            },
            {
                name: "Queue",
                value: "queue"
            }
        ],
        locales: {
            name: "locales.loop.option.name",
            description: "locales.loop.option.description"
        }
    })
};

@Declare({
    name: "loop",
    description: "Toggle the loop mode.",
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"],
    aliases: ["l"]
})
@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer"])
@StelleOptions({
    cooldown: 5,
    category: StelleCategory.Music
})
@LocalesT("locales.loop.name", "locales.loop.description")
@Options(cmdOptions)
export default class LoopCommand extends Command {
    public override async run(ctx: CommandContext<typeof cmdOptions>) {
        const { client, options, guildId } = ctx;
        const { mode } = options;

        if (!guildId) {
            return;
        }

        const { messages } = await ctx.getLocale();

        const player = client.manager.getPlayer(guildId);
        if (!player) {
            return;
        }

        await player.setRepeatMode(mode as RepeatMode);
        await ctx.editOrReply({
            embeds: [
                {
                    color: client.config.color.success,
                    description: messages.commands.autoplay.toggled({
                        type: messages.commands.loop.loopType[getLoopState(player.repeatMode, true)]
                    })
                }
            ]
        });
    }
}
