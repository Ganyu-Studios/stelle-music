import type { Message, UsingClient } from "seyfert";
import { EmbedColors } from "seyfert/lib/common/index.js";

export async function mentionListener(client: UsingClient, message: Message) {
    const { guildId, content } = message;

    if (!guildId) return;

    const mentionRegex = new RegExp(`^<@!?${client.me.id}>( |)$`);
    if (content.match(mentionRegex)) {
        const { messages } = client.t(await client.database.getLocale(guildId)).get();

        const command = client.commands?.values.find((command) => command.name === "help");
        if (!command) {
            await message.react("❌");
            return message.reply({
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
