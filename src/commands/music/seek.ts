import { type CommandContext, createStringOption, type OKFunction, Middlewares, LocalesT, Command, Declare, Options } from "seyfert";
import { TimeFormat, ms } from "#stelle/utils/TimeFormat.js";
import { EmbedColors } from "seyfert/lib/common/index.js";
import { StelleOptions } from "#stelle/decorators";
import { StelleCategory } from "#stelle/types";

const options = {
    time: createStringOption({
        description: "Enter the time. (Ex: 2min=",
        required: true,
        locales: {
            name: "locales.seek.option.name",
            description: "locales.seek.option.description"
        },
        value: ({ value }, ok: OKFunction<number | string>) => {
            const time = value.split(/\s*,\s*|\s+/);
            const milis = time.map((x) => ms(x));
            const result = milis.reduce((a, b) => a + b, 0);

            if (Number.isNaN(result)) {
                ok(value); return;
            }

            ok(result);
        }
    })
};

@Declare({
    name: "seek",
    description: "Seek the current track.",
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"],
    aliases: ["sk"]
})
@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer"])
@StelleOptions({
    cooldown: 5,
    category: StelleCategory.Music
})
@LocalesT("locales.seek.name", "locales.seek.description")
@Options(options)
export default class SeekCommand extends Command {
    public override async run(ctx: CommandContext<typeof options>) {
        const { client, options, guildId } = ctx;
        const { time } = options;

        if (!guildId) {
            return;
        }

        const { messages } = await ctx.getLocale();

        const player = client.manager.getPlayer(guildId);
        if (!player) {
            return;
        }

        const position = player.position;
        const track = player.queue.current;

        if (typeof time === "string" || Number.isNaN(time) || !Number.isFinite(time)) {
            return ctx.editOrReply({
                embeds: [
                    {
                        description: messages.commands.seek.invalidTime({ time }),
                        color: EmbedColors.Red
                    }
                ]
            });
        }

        if (!track?.info.isSeekable) {
            return ctx.editOrReply({
                embeds: [
                    {
                        description: messages.commands.seek.noSeekable,
                        color: EmbedColors.Red
                    }
                ]
            });
        }

        if (time > track.info.duration) {
            return ctx.editOrReply({
                embeds: [
                    {
                        description: messages.commands.seek.exeedsTime({ time: TimeFormat.toHumanize(time) }),
                        color: EmbedColors.Red
                    }
                ]
            });
        }

        await player.seek(time);
        await ctx.editOrReply({
            embeds: [
                {
                    color: client.config.color.success,
                    description: messages.commands.seek.seeked({
                        time: TimeFormat.toHumanize(time),
                        type: messages.commands.seek.type[time < position
                            ? "rewond"
                            : "seeked"]
                    })
                }
            ]
        });
    }
}
