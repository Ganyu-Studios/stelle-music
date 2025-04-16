import {
    Command,
    type CommandContext,
    Declare,
    Embed,
    type Message,
    Options,
    type WebhookMessage,
    createNumberOption,
    createStringOption,
} from "seyfert";
import { EmbedColors, Formatter } from "seyfert/lib/common/index.js";

import { Environment } from "#stelle/utils/data/configuration.js";
import { StelleOptions } from "#stelle/utils/decorator.js";
import { getInspect, sliceText } from "#stelle/utils/functions/utils.js";

import { DeclareParserConfig, ParserRecommendedConfig, Watch, Yuna } from "yunaforseyfert";
import { Constants } from "#stelle/utils/data/constants.js";
import { ms } from "#stelle/utils/functions/time.js";

const secretsRegex = /\b(?:client\.(?:config)|config|env|process\.(?:env|exit)|eval|atob|btoa)\b/;
const concatRegex = /".*?"\s*\+\s*".*?"(?:\s*\+\s*".*?")*/;
const awaitableRegex = /^(?:\(?)\s*await\b/;
const envRegex = new RegExp(
    Object.values(Environment)
        .map((value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join("|"),
    "g",
);

const options = {
    code: createStringOption({
        description: "Enter some code.",
        required: true,
    }),
    depth: createNumberOption({
        description: "Enter the depth of the result code.",
        required: false,
    }),
};

@Declare({
    name: "eval",
    description: "Eval code with Stelle.",
    aliases: ["code"],
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
        beforeCreate(ctx): void {
            const watcher = Yuna.watchers.find(ctx.client, { userId: ctx.author.id, command: this, channelId: ctx.channelId });
            if (!watcher) return;

            watcher.stop("Another execution");
        },
        onStop(reason): void {
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
        const { client, options, author, channelId } = ctx;

        const now = Date.now();

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
            if (secretsRegex.test(code.toLowerCase()) || concatRegex.test(code.toLowerCase())) output = Constants.SecretMessage();
            else if (typeof output !== "string") {
                if (awaitableRegex.test(code.toLowerCase())) code = `(async () => ${code})()`;

                output = await eval(code);
                typecode = typeof output;
                output = getInspect(output, options.depth ?? 0);

                // 100% security
                if (envRegex.test(output)) output = output.replaceAll(envRegex, "🌟");
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
                                value: `\`${Math.floor(Date.now() - now)}ms\``,
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
                        .setDescription("`❌` - An error occurred while trying to evaluate.")
                        .addFields(
                            {
                                name: "`📖` Type",
                                value: `${Formatter.codeBlock(typecode, "js")}`,
                                inline: true,
                            },
                            {
                                name: "`⏳` Evaluated",
                                value: `\`${Math.floor(Date.now() - now)}ms\``,
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
