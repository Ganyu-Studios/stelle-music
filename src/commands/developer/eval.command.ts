import {
    Command,
    type CommandContext,
    createNumberOption,
    createStringOption,
    Declare,
    Embed,
    type MessageStructure,
    Options,
    type WebhookMessageStructure,
} from "seyfert";
import { EmbedColors, Formatter } from "seyfert/lib/common/index.js";
import { ApplicationIntegrationType, InteractionContextType, PermissionFlagsBits } from "seyfert/lib/types/index.js";
import { DeclareParserConfig, ParserRecommendedConfig, Watch, Yuna } from "yunaforseyfert";
import { Environment } from "#stelle/utils/data/configuration.js";
import { StelleText } from "#stelle/utils/data/constants.js";
import { StelleOptions } from "#stelle/utils/decorator.js";
import { ms } from "#stelle/utils/functions/internal/time.js";
import { UtilsOps } from "#stelle/utils/functions/internal/utils.js";

const SECRETS_REGEX = /\b(?:client\.(?:config)|config|env|process\.(?:env|exit)|eval|atob|btoa)\b/;
const CONCAT_REGEX = /".*?"\s*\+\s*".*?"(?:\s*\+\s*".*?")*/;
const AWAITABLE_REGEX = /^(?:\(?)\s*await\b/;
const ENV_REGEX = new RegExp(
    Object.values(Environment)
        .map((value): string => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
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
    defaultMemberPermissions: [PermissionFlagsBits.ManageGuild, PermissionFlagsBits.Administrator],
    integrationTypes: [ApplicationIntegrationType.GuildInstall],
    contexts: [InteractionContextType.Guild],
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

            watcher.stop("Another instance running.");
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
    public override async run(ctx: CommandContext<typeof options>): Promise<MessageStructure | WebhookMessageStructure | void> {
        const { client, options, author, channelId } = ctx;

        const now = Date.now();

        let code: string = options.code;
        let output: string | null = null;
        let typecode: any;

        if (ctx.message) await client.channels.typing(channelId);

        if (!code.length) return ctx.errorReply("`❌` Hey! Try typing some code to be evaluated...");

        try {
            if (SECRETS_REGEX.test(code.toLowerCase()) || CONCAT_REGEX.test(code.toLowerCase())) output = StelleText.Secret();
            else if (typeof output !== "string") {
                if (AWAITABLE_REGEX.test(code.toLowerCase())) code = `(async () => ${code})()`;

                output = await eval(code);
                typecode = typeof output;
                output = UtilsOps.inspect(output, options.depth ?? 0);

                // 100% security
                if (ENV_REGEX.test(output)) output = output.replaceAll(ENV_REGEX, "🌟");
            }

            await ctx.editOrReply({
                embeds: [
                    new Embed()
                        .setAuthor({ name: author.tag, iconUrl: author.avatarURL() })
                        .setColor(client.config.color.success)
                        .setDescription(
                            `\`📖\` A code has been evaluated.\n \n${Formatter.codeBlock(UtilsOps.truncate(output, 1900), "js")}`,
                        )
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
                            { name: "`📥` Input", value: `${Formatter.codeBlock(UtilsOps.truncate(options.code, 1024), "js")}` },
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
                                value: `${Formatter.codeBlock(UtilsOps.truncate(options.code, 1024), "js")}`,
                            },
                            {
                                name: "`📤` Output",
                                value: `${Formatter.codeBlock(UtilsOps.truncate(`${error}`, 1024), "js")}`,
                            },
                        ),
                ],
            });
        }
    }
}
