import { type AnyContext, AttachmentBuilder, Embed } from "seyfert";
import { Environment } from "#stelle/data/Configuration.js";

import { logger } from "../Logger.js";
import { parseWebhook, sliceText } from "./utils.js";

import { DEV_MODE } from "#stelle/data/Constants.js";

// yeah, I need the client to send things through a webhook.
import client from "#stelle/index";

type Options = {
    /**
     * The error.
     */
    error: Error | unknown;
    /**
     * The context.
     */
    ctx?: AnyContext;
};

/**
 *
 * Send a error report.
 * @param options The options.
 */
export async function sendErrorReport(options: Options) {
    const { error, ctx } = options;

    if (!(error instanceof Error)) return;

    //as long as I'm with the dev version of Stelle,
    //i don't want the logs to be sent to the server.
    if (DEV_MODE) return logger.error(options.error);

    const date = new Date();
    const title = ctx?.client.me.username ?? "Stelle";
    const attachment = new AttachmentBuilder()
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
                    `Stack: ${error.stack}`,
                    `Message: ${error.message}`,
                ].join("\n"),
            ),
        );

    const embed = new Embed()
        .setColor("Red")
        .setTitle(`${title} | Error`)
        .setDescription(
            `\`🏮\` An error ocurred while I tried to run.\n\n \`📜\` Name: ${sliceText(error.name, 1000)}\n\`📨\` Reason: ${sliceText(error.message, 1000)}`,
        );

    if (ctx) {
        const { client, author } = ctx;

        if (client.me) {
            const guild = await ctx.guild();

            if (guild) {
                embed
                    .setThumbnail(guild.iconURL() ?? author.avatarURL() ?? client.me.avatarURL())
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

    const webhook = parseWebhook(Environment.ErrorsWebhook!);
    if (!webhook) return;

    await client.webhooks.writeMessage(webhook.id, webhook.token, {
        body: {
            embeds: [embed],
            files: [attachment],
        },
    });
}
