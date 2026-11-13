import { type AnyContext, AttachmentBuilder, Embed, type MessageStructure } from "seyfert";
import { WebhookClient } from "#stelle/classes/client/WebhookClient.js";
import { Environment } from "#stelle/utils/data/configuration.js";
import { StelleMeta } from "#stelle/utils/data/constants.js";
import { logger } from "#stelle/utils/functions/internal/logger.js";
import { UtilsOps } from "#stelle/utils/functions/internal/utils.js";

/**
 * The report options interface.
 */
interface ReportOptions {
    /**
     * The error to report.
     * @type {Error | unknown}
     */
    error: Error | unknown;
    /**
     * The context of the command or whatever the context is.
     * @type {AnyContext}
     */
    ctx?: AnyContext;
}

/**
 *
 * Send a error report. Never rejects: it runs inside error handlers, so a failed delivery (e.g. the webhook or the
 * errors channel being unreachable) is logged along with the original error instead of escaping as a new rejection.
 * @param options The options.
 */
export async function sendErrorReport(options: ReportOptions): Promise<void> {
    await UtilsOps.try(
        () => report(options),
        (error: unknown): void =>
            logger.error(
                `[Report] Failed to send the error report | error: ${UtilsOps.inspect(options.error)} | report error: ${UtilsOps.inspect(error)}`,
            ),
    );
}

/**
 *
 * Build and deliver the error report.
 * @param options The options.
 */
async function report(options: ReportOptions): Promise<MessageStructure | void> {
    const { error, ctx } = options;

    if (!(error instanceof Error)) return;

    //as long as I'm with the dev version of Stelle,
    //i don't want the logs to be sent to the server.
    if (StelleMeta.Dev) return logger.error("[Report] Error captured (dev mode)", options.error);

    const date = new Date();
    const title: string = ctx?.client.me.username ?? "Stelle";
    const attachment: AttachmentBuilder = new AttachmentBuilder()
        .setName(`${title}-Error.log`)
        .setFile(
            "buffer",
            Buffer.from(
                [
                    "+---- STELLE ERROR ----+",
                    "  - Stelle had an error... (Did I do something wrong...?)",
                    "",
                    ` Date: ${date.toLocaleDateString()}`,
                    ` Time: ${date.toLocaleTimeString()}`,
                    "",
                    "+------------------------------+",
                    "",
                    `Error: ${UtilsOps.inspect(error, 1)}`,
                ].join("\n"),
            ),
        );

    const embed = new Embed()
        .setColor("Red")
        .setTitle(`${title} | Error`)
        .setDescription(
            `\`🏮\` An error ocurred while I tried to run.\n\n \`📜\` Name: ${UtilsOps.truncate(error.name, 1000)}\n\`📨\` Reason: ${UtilsOps.truncate(error.message, 1000)}`,
        );

    if (ctx) {
        const { client, author } = ctx;

        if (client.me) {
            const guild = await ctx.guild();
            if (guild) {
                embed
                    .setThumbnail(guild.iconURL() ?? author.avatarURL())
                    .addFields(
                        { name: "`📦` From", value: `\`${guild.name}\``, inline: true },
                        { name: "`👤` Executed By", value: `\`${author.tag}\``, inline: true },
                    );
            }

            return client.messages.write(client.config.channels.errorsId, {
                embeds: [embed],
                files: [attachment],
            });
        }
    }

    const webhook = new WebhookClient(Environment.ERRORS_WEBHOOK);

    await webhook.writeMessage({
        body: {
            embeds: [embed],
            files: [attachment],
        },
    });
}
