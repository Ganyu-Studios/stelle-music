import type { Player, RepeatMode } from "lavalink-client";
import { Command, createStringOption, Declare, type GuildCommandContext, LocalesT, Middlewares, Options } from "seyfert";
import { StelleCategory } from "#stelle/types";
import { Constants } from "#stelle/utils/data/constants.js";
import { StelleOptions } from "#stelle/utils/decorator.js";

const loopModes: Record<RepeatMode, RepeatMode> = {
    off: "track",
    track: "queue",
    queue: "off",
};

const options = {
    mode: createStringOption({
        description: "Select the loop mode.",
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
        ] as const,
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
    public override async run(ctx: GuildCommandContext<typeof options>): Promise<void> {
        const { client, options } = ctx;

        const { messages } = await ctx.locale();

        const player: Player | undefined = client.manager.getPlayer(ctx.guildId);
        if (!player) return;

        const mode: RepeatMode = options.mode ?? loopModes[player.repeatMode];

        await player.setRepeatMode(mode);
        await ctx.editOrReply({
            embeds: [
                {
                    color: client.config.color.success,
                    description: messages.commands.loop.toggled({
                        type: messages.commands.loop.loopType[Constants.LoopMode(player.repeatMode, true)],
                    }),
                },
            ],
        });
    }
}
