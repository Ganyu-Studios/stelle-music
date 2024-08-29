import { Command, type CommandContext, Declare, LocalesT, Options, createStringOption } from "seyfert";
import { StelleOptions } from "#stelle/decorators";

import type { RepeatMode } from "lavalink-client";

import { LOOP_STATE } from "#stelle/data/Constants.js";
import { StelleCategory } from "#stelle/types";

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
@StelleOptions({ cooldown: 5, category: StelleCategory.Music, checkPlayer: true, inVoice: true, sameVoice: true, checkNodes: true })
@Options(options)
@LocalesT("locales.loop.name", "locales.loop.description")
export default class LoopCommand extends Command {
    public override async run(ctx: CommandContext<typeof options>) {
        const { client, options, guildId } = ctx;
        const { mode } = options;

        if (!guildId) return;

        const { messages } = await ctx.getLocale();

        const player = client.manager.getPlayer(guildId);
        if (!player) return;

        await player.setRepeatMode(mode as RepeatMode);
        await ctx.editOrReply({
            embeds: [
                {
                    color: client.config.color.success,
                    description: messages.commands.autoplay.toggled({
                        type: messages.commands.loop.loopType[LOOP_STATE(player.repeatMode, true)],
                    }),
                },
            ],
        });
    }
}
