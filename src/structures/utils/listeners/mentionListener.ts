import type { Message, UsingClient } from "seyfert";
import { EmbedColors } from "seyfert/lib/common/index.js";

/**
 *
 * The listener for the `messageCreate` event of the client.
 * @param {UsingClient} client The client instance.
 * @param {Message} message The message instance.
 * @returns {Promise<void>} The promise, with fun!
 */
export async function mentionListener(client: UsingClient, message: Message): Promise<void> {
    const { guildId, content } = message;

    if (!guildId) return;

    const mentionRegex = new RegExp(`^<@!?${client.me.id}>( |)$`);
    if (content.match(mentionRegex)) {
        const { messages } = client.t(await client.database.getLocale(guildId)).get();

        const command = client.commands.values.find((command) => command.name === "help");
        if (!command) {
            await message.react("❌");
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

        await message.react("🌟");
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
