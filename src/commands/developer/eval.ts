import { type CommandContext, Declare, Embed, type OKFunction, Options, createStringOption } from "seyfert";
import { EmbedColors } from "seyfert/lib/common/index.js";
import { StelleCommand } from "#stelle/classes";

import { codeBlock, getDepth, sliceText } from "#stelle/utils/functions/utils.js";

import { Configuration } from "#stelle/data/Configuration.js";

import { SECRETS_MESSAGES, SECRETS_REGEX } from "#stelle/data/Constants.js";
import { StelleOptions } from "#stelle/decorators";

import { DeclareParserConfig, ParserRecommendedConfig } from "#stelle/parser";

const options = {
    code: createStringOption({
        description: "Enter some code.",
        required: true,
        value: ({ value }, ok: OKFunction<string>) => {
            const codeRegex = /```(?:\w+\n)?([\s\S]+?)```/g;
            return ok(codeRegex.exec(value)?.[1] ?? value);
        },
    }),
};

@Declare({
    name: "eval",
    description: "Eval code with stelle.",
    aliases: ["code"],
    guildId: Configuration.guildIds,
})
@Options(options)
@StelleOptions({ onlyDeveloper: true })
@DeclareParserConfig(ParserRecommendedConfig.Eval)
export default class EvalCommand extends StelleCommand {
    async run(ctx: CommandContext<typeof options>) {
        const { client, options, author, member, channelId } = ctx;

        await author.fetch();
        await member?.fetch();

        const start = Date.now();

        let code: string = options.code;
        let output: string | null = null;
        let typecode: any;

        await client.channels.typing(channelId);

        if (!code.length)
            return ctx.editOrReply({
                embeds: [
                    {
                        description: "`❌` Hey! Try typing some code to be evaluated...",
                        color: EmbedColors.Red,
                    },
                ],
            });

        try {
            const concatText = /".*?"\s*\+\s*".*?"(?:\s*\+\s*".*?")*/;
            if (SECRETS_REGEX.test(code.toLowerCase()) || concatText.test(code.toLowerCase()))
                output = SECRETS_MESSAGES[Math.floor(Math.random() * SECRETS_MESSAGES.length)];
            else if (typeof output !== "string") {
                if (/^(?:\(?)\s*await\b/.test(code.toLowerCase())) code = `(async () => ${code})()`;

                console.info({ code, typecode });

                output = await eval(code);
                typecode = typeof output;
                output = getDepth(output)
                    .replaceAll(process.env.TOKEN, client.token)
                    .replaceAll(process.env.SPOTIFY_ID, client.token)
                    .replaceAll(process.env.SPOTIFY_SECRET, client.token);
            }

            await ctx.editOrReply({
                embeds: [
                    new Embed()
                        .setAuthor({ name: author.tag, iconUrl: author.avatarURL() })
                        .setColor(client.config.color.success)
                        .setDescription(`\`📖\` A code has been evaluated.\n \n${codeBlock("js", sliceText(output, 1900))}`)
                        .setThumbnail(client.me.avatarURL())
                        .setTimestamp()
                        .addFields(
                            {
                                name: "`📖` Type",
                                value: `${codeBlock("js", typecode)}`,
                                inline: true,
                            },
                            {
                                name: "`⏳` Evaluated",
                                value: `\`${Math.floor(Date.now() - start)}ms\``,
                                inline: true,
                            },
                            { name: "`📥` Input", value: `${codeBlock("js", sliceText(options.code, 1024))}` },
                            { name: "`📤` Output", value: "Check the embed description." },
                        ),
                ],
            });
        } catch (error) {
            await ctx.editOrReply({
                embeds: [
                    new Embed()
                        .setAuthor({ name: author.tag, iconUrl: author.avatarURL() })
                        .setColor("Red")
                        .setDescription("`❌`~  An error occurred while trying to evaluate.")
                        .addFields(
                            {
                                name: "`📖` Type",
                                value: `${codeBlock("js", typecode)}`,
                                inline: true,
                            },
                            {
                                name: "`⏳` Evaluated",
                                value: `\`${Math.floor(Date.now() - start)}ms\``,
                                inline: true,
                            },
                            {
                                name: "`📥` Input",
                                value: `${codeBlock("js", sliceText(options.code, 1024))}`,
                            },
                            {
                                name: "`📤` Output",
                                value: `${codeBlock("js", sliceText(`${error}`, 1024))}`,
                            },
                        ),
                ],
            });
        }
    }
}
