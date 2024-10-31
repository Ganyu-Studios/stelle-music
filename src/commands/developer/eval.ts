import { Command, type CommandContext, Declare, Embed, type Message, Options, type WebhookMessage, createStringOption } from "seyfert";
import { EmbedColors, Formatter } from "seyfert/lib/common/index.js";
import { StelleOptions } from "#stelle/decorators";

import { Configuration } from "#stelle/data/Configuration.js";
import { getDepth, sliceText } from "#stelle/utils/functions/utils.js";

import { DeclareParserConfig, ParserRecommendedConfig, Watch, Yuna } from "yunaforseyfert";
import { SECRETS_MESSAGES, SECRETS_REGEX } from "#stelle/data/Constants.js";
import { ms } from "#stelle/utils/TimeFormat.js";

const options = {
    code: createStringOption({
        description: "Enter some code.",
        required: true,
    }),
};

@Declare({
    name: "eval",
    description: "Eval code with Stelle.",
    aliases: ["code"],
    guildId: Configuration.guildIds,
    defaultMemberPermissions: ["ManageGuild", "Administrator"],
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"],
})
@Options(options)
@StelleOptions({ onlyDeveloper: true })
@DeclareParserConfig(ParserRecommendedConfig.Eval)
export default class EvalCommand extends Command {
    @Watch({
        idle: ms("1min"),
        beforeCreate(ctx) {
            const watcher = Yuna.watchers.find(ctx.client, { userId: ctx.author.id, command: this });
            if (!watcher) return;

            watcher.stop("Another execution");
        },
        onStop(reason) {
            this.ctx?.editOrReply({
                content: "",
                embeds: [
                    {
                        description: `\`🐐\` Eval command watcher ended by: \`${reason}\``,
                        color: EmbedColors.White,
                    },
                ],
            });
        },
    })
    public override async run(ctx: CommandContext<typeof options>): Promise<Message | WebhookMessage | void> {
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

                output = await eval(code);
                typecode = typeof output;
                output = getDepth(output).replaceAll(process.env.TOKEN!, client.token);
            }

            await ctx.editOrReply({
                embeds: [
                    new Embed()
                        .setAuthor({ name: author.tag, iconUrl: author.avatarURL() })
                        .setColor(client.config.color.success)
                        .setDescription(`\`📖\` A code has been evaluated.\n \n${Formatter.codeBlock(sliceText(output, 1900), "js")}`)
                        .setThumbnail(client.me.avatarURL())
                        .setTimestamp()
                        .addFields(
                            {
                                name: "`📖` Type",
                                value: `${Formatter.codeBlock(typecode, "js")}`,
                                inline: true,
                            },
                            {
                                name: "`⏳` Evaluated",
                                value: `\`${Math.floor(Date.now() - start)}ms\``,
                                inline: true,
                            },
                            { name: "`📥` Input", value: `${Formatter.codeBlock(sliceText(options.code, 1024), "js")}` },
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
                                value: `${Formatter.codeBlock(typecode, "js")}`,
                                inline: true,
                            },
                            {
                                name: "`⏳` Evaluated",
                                value: `\`${Math.floor(Date.now() - start)}ms\``,
                                inline: true,
                            },
                            {
                                name: "`📥` Input",
                                value: `${Formatter.codeBlock(sliceText(options.code, 1024), "js")}`,
                            },
                            {
                                name: "`📤` Output",
                                value: `${Formatter.codeBlock(sliceText(`${error}`, 1024), "js")}`,
                            },
                        ),
                ],
            });
        }
    }
}
