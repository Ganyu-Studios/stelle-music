import { Command, type CommandContext, Declare, LocalesT, type OKFunction, Options, createStringOption } from "seyfert";
import { StelleOptions } from "#stelle/decorators";

import { EmbedColors } from "seyfert/lib/common/index.js";

import { msParser } from "#stelle/utils/functions/utils.js";

import ms from "ms";

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
@StelleOptions({ cooldown: 5, checkPlayer: true, inVoice: true, sameVoice: true, checkNodes: true })
@Options(options)
@LocalesT("locales.seek.name", "locales.seek.description")
export default class SeekCommand extends Command {
    async run(ctx: CommandContext<typeof options>) {
        const { client, options, guildId } = ctx;
        const { time } = options;

        if (!guildId) return;

        const { messages } = ctx.t.get(await ctx.getLocale());

        const player = client.manager.getPlayer(guildId);
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

        if (!track?.isSeekable)
            return ctx.editOrReply({
                embeds: [
                    {
                        description: messages.commands.seek.noSeekable,
                        color: EmbedColors.Red,
                    },
                ],
            });

        if (time > (track.length ?? 0))
            return ctx.editOrReply({
                embeds: [
                    {
                        description: messages.commands.seek.exeedsTime({ time: msParser(time) }),
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
                        time: msParser(time),
                        type: messages.commands.seek.type[time < position ? "rewond" : "seeked"],
                    }),
                },
            ],
        });
    }
}
