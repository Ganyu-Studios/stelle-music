import { LoadType } from "hoshimi";
import type { AllGuildVoiceChannels, GuildMember, MessageStructure, UsingClient, VoiceState } from "seyfert";
import { EmbedColors } from "seyfert/lib/common/index.js";
import { ContextOps } from "#stelle/utils/functions/internal/context.js";
import { resolveAndQueue } from "#stelle/utils/functions/manager/play.js";

/**
 * Send a short-lived message to a channel and delete it after `ttl` ms. Used for request-channel feedback, since a
 * plain message listener has no ephemeral replies.
 * @param {UsingClient} client The client instance.
 * @param {string} channelId The channel to send to.
 * @param {string} description The embed description.
 * @param {number} [ttl] The lifetime in milliseconds.
 * @returns {Promise<void>} A promise that resolves once the message is sent.
 */
async function sendTemporary(client: UsingClient, channelId: string, description: string, ttl: number = 6000): Promise<void> {
    const message: MessageStructure | null = await client.messages
        .write(channelId, { embeds: [{ description, color: EmbedColors.Red }] })
        .catch((): null => null);

    if (message) setTimeout((): void => void client.messages.delete(message.id, channelId).catch((): null => null), ttl);
}

/**
 *
 * The listener for the `messageCreate` event, handling the request channel. When a non-bot message lands in the guild's
 * configured request channel, it's treated as a play query: the message is deleted and the query is enqueued (the
 * persistent panel updates via the track events). Returns `true` when the message belonged to the request channel (so
 * the caller skips the mention listener).
 * @param {UsingClient} client The client instance.
 * @param {MessageStructure} message The message instance.
 * @returns {Promise<boolean>} Whether the message was handled as a request.
 */
export async function requestListener(client: UsingClient, message: MessageStructure): Promise<boolean> {
    const { guildId, author, channelId, content, member } = message;
    if (!guildId || author.bot) return false;

    const config = await client.database.requests.get(guildId);
    if (!config || channelId !== config.channelId) return false;

    // The message belongs to the request channel: consume it regardless of what happens next.
    await message.delete().catch((): null => null);

    const query: string = content.trim();
    if (!query || !member) return true;

    const { messages } = await ContextOps.locale(client, guildId);

    if (!client.manager.isUseable()) {
        await sendTemporary(client, channelId, messages.events.noNodes);
        return true;
    }

    const state: VoiceState | null = await member.voice().catch((): null => null);
    const voice: AllGuildVoiceChannels | undefined = await state?.channel();
    if (!voice) {
        await sendTemporary(client, channelId, messages.events.noVoiceChannel);
        return true;
    }

    const me: GuildMember | null = await client.members.fetch(guildId, client.botId).catch((): null => null);
    if (!me) return true;

    const { loadType, tracks } = await resolveAndQueue({
        client,
        guildId,
        voice,
        me,
        textId: config.channelId,
        requester: author,
        query,
        localeString: await client.database.locales.get(guildId),
        isRequestChannel: true,
    });

    if (loadType === LoadType.Empty || loadType === LoadType.Error || !tracks.length)
        await sendTemporary(client, channelId, messages.commands.play.noResults);

    return true;
}
