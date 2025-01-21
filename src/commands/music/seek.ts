import { Command, Declare, type GuildCommandContext, LocalesT, Middlewares, type OKFunction, Options, createStringOption } from "seyfert";
import { StelleOptions } from "#stelle/decorators";

import { EmbedColors } from "seyfert/lib/common/index.js";

import { StelleCategory } from "#stelle/types";
import { TimeFormat, ms } from "#stelle/utils/Time.js";

const options = {
    time: createStringOption({
        description: "Enter the time. (Ex: 2min=",
        required: true,
        locales: {
            name: "locales.seek.option.name",
            description: "locales.seek.option.description",
        },
        value: ({ value }, ok: OKFunction<number | string>) => {
            const time = value.split(/\s*,\s*|\s+/);
            const milis = time.map((x) => ms(x));
            const result = milis.reduce((a, b) => a + b, 0);

            if (Number.isNaN(result)) return ok(value);

            return ok(result);
        },
    }),
};

@Declare({
    name: "seek",
    description: "Seek the current track.",
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"],
    aliases: ["sk"],
})
@StelleOptions({ cooldown: 5, category: StelleCategory.Music })
@Options(options)
@LocalesT("locales.seek.name", "locales.seek.description")
@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer"])
export default class SeekCommand extends Command {
    public override async run(ctx: GuildCommandContext<typeof options>) {
        const { client, options } = ctx;
        const { time } = options;

        const { messages } = await ctx.getLocale();

        const player = client.manager.getPlayer(ctx.guildId);
        if (!player) return;

        const position = player.position;
        const track = player.queue.current;

        if (typeof time === "string" || Number.isNaN(time) || !Number.isFinite(time))
            return ctx.editOrReply({
                embeds: [
                    {
                        description: messages.commands.seek.invalidTime({ time }),
                        color: EmbedColors.Red,
                    },
                ],
            });

        if (!track?.info.isSeekable)
            return ctx.editOrReply({
                embeds: [
                    {
                        description: messages.commands.seek.noSeekable,
                        color: EmbedColors.Red,
                    },
                ],
            });

        if (time > track.info.duration)
            return ctx.editOrReply({
                embeds: [
                    {
                        description: messages.commands.seek.exeedsTime({ time: TimeFormat.toHumanize(time) }),
                        color: EmbedColors.Red,
                    },
                ],
            });

        await player.seek(time);
        await ctx.editOrReply({
            embeds: [
                {
                    color: client.config.color.success,
                    description: messages.commands.seek.seeked({
                        time: TimeFormat.toHumanize(time),
                        type: messages.commands.seek.type[time < position ? "rewond" : "seeked"],
                    }),
                },
            ],
        });
    }
}
