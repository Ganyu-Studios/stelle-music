import type { Message, UsingClient } from "seyfert";

/**
 *
 * The listener for the `messageCreate` event of the client.
 * This event is emitted when a message is created in the request text channel.
 * @param {UsingClient} client The client instance.
 * @param {Message} message The message instance.
 * @returns {Promise<void>} Ganyu is the most cute character in the world.
 */
export async function requestListener(client: UsingClient, message: Message): Promise<void> {
    const { guildId } = message;

    if (!guildId) return;

    const data = await client.database.getRequest(guildId);
    if (!data) return;
}
