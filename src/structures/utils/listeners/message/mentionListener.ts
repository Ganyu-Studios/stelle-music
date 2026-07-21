import type { MessageStructure, UsingClient } from "seyfert";
import { EmbedColors } from "seyfert/lib/common/index.js";
import { resolveLocale } from "#stelle/utils/functions/internal/discord.js";

/**
 *
 * The listener for the `messageCreate` event of the client.
 * This listener is triggered when the bot is mentioned in a message.
 * @param {UsingClient} client The client instance.
 * @param {MessageStructure} message The message instance.
 * @returns {Promise<void>} The promise, with fun!
 */
export async function mentionListener(client: UsingClient, message: MessageStructure): Promise<void> {
    const { guildId, content } = message;

    if (!guildId) return;

    const mentionRegex = new RegExp(`^<@!?${client.me.id}>( |)$`);
    if (content.match(mentionRegex)) {
        const { messages } = await resolveLocale(client, guildId);

        const command = client.commands.values.find((command) => command.name === "help");
        if (!command) {
            await message.react("❌").catch((): null => null);
            await message.reply({
                allowed_mentions: {
                    replied_user: true,
                },
                embeds: [
                    {
                        color: EmbedColors.Red,
                        description: messages.events.noCommand,
                    },
                ],
            });

            return;
        }

        await message.react("🌟").catch((): null => null);
        await message.reply({
            allowed_mentions: {
                replied_user: true,
            },
            embeds: [
                {
                    color: client.config.color.success,
                    description: messages.events.mention({
                        clientName: client.me.username,
                        defaultPrefix: client.config.defaultPrefix,
                        commandName: command.name,
                    }),
                },
            ],
        });
    }
}
