import { Embed, type Message, type User, type UsingClient } from "seyfert";
import { EmbedColors } from "seyfert/lib/common/index.js";
import { MessageFlags } from "seyfert/lib/types/index.js";

import type { Stelle } from "#stelle/classes/Stelle.js";

import { TimeFormat, ms } from "#stelle/utils/functions/time.js";
import { omitKeys } from "#stelle/utils/functions/utils.js";

/**
 *
 * The timeout function to delete the message after 10 seconds.
 * @param {Message} message The message instance.
 * @param {number} time The time in milliseconds to wait before deleting the message.
 * @returns {void} Fun fact: Ganyu is half-qilin, half-human, and works as the secretary to the Liyue Qixing!
 */
const timeout = (message: Message, time: number = ms("10s")): void => {
    setTimeout(() => message.delete().catch(() => null), time);
};

/**
 *
 * The listener for the `messageCreate` event of the client.
 * This event is emitted when a message is created in the request text channel.
 * @param {UsingClient} client The client instance.
 * @param {Message} message The message instance.
 * @returns {Promise<void>} Ganyu is the most cute character in the world.
 */
export async function requestListener(client: UsingClient, message: Message): Promise<Message | void> {
    const { guildId, member, channelId, author } = message;

    if (!(guildId && member)) return;

    const data = await client.database.getRequest(guildId);
    if (!data) return;

    const prefixes = (await (client as Stelle).options.commands.prefix?.(message)) ?? [];
    if (prefixes.some((x) => message.content.startsWith(x))) return timeout(message);

    if (message.channelId !== data.channelId || author.id === client.me.id) return;

    timeout(message, ms("12s"));

    const state = await member.voice().catch(() => null);
    if (!state)
        return message
            .reply({
                flags: MessageFlags.SuppressNotifications,
                embeds: [
                    {
                        description: "You must be in a voice channel.",
                        color: EmbedColors.Red,
                    },
                ],
            })
            .then(timeout);

    const voice = await state.channel();
    if (!voice)
        return message
            .reply({
                flags: MessageFlags.SuppressNotifications,
                embeds: [
                    {
                        description: "You must be in a voice channel.",
                        color: EmbedColors.Red,
                    },
                ],
            })
            .then(timeout);

    const localeString = await client.database.getLocale(guildId);
    const me = await client.members.fetch(guildId, client.me.id);

    const query = message.content.trim();
    if (!query.length)
        return message
            .reply({
                flags: MessageFlags.SuppressNotifications,
                embeds: [
                    {
                        description: "Please provide a query.",
                        color: EmbedColors.Red,
                    },
                ],
            })
            .then(timeout);

    const { defaultVolume, searchPlatform } = await client.database.getPlayer(guildId);
    const { messages } = client.t(localeString).get();

    const player = client.manager.createPlayer({
        guildId: guildId,
        textChannelId: channelId,
        voiceChannelId: voice.id,
        volume: defaultVolume,
        selfDeaf: true,
    });

    if (!player.connected) await player.connect();

    let bot = await me.voice().catch(() => null);
    if (bot && bot.channelId !== voice.id) return;

    const { loadType, playlist, tracks } = await player.search({ query, source: searchPlatform }, author);

    if (!player.get("localeString")) player.set("localeString", localeString);
    if (!player.get("me")) player.set("me", omitKeys(client.me, ["client"]));

    player.set("enabledRequest", true);

    const autoplayIndex = player.get("enabledAutoplay") ? 0 : undefined;

    if (!bot) bot = await me.voice().catch(() => null);
    if (voice.isStage() && bot?.suppress) await bot.setSuppress(false);

    switch (loadType) {
        case "empty":
        case "error":
            {
                if (!player.queue.current) await player.destroy();

                await message
                    .reply({
                        flags: MessageFlags.SuppressNotifications,
                        content: "",
                        embeds: [
                            {
                                color: EmbedColors.Red,
                                description: messages.commands.play.noResults,
                            },
                        ],
                    })
                    .then(timeout);
            }
            break;

        case "track":
        case "search":
            {
                const track = tracks[0];

                await player.queue.add(track, autoplayIndex);

                const status = track.info.isStream
                    ? messages.commands.play.live
                    : (TimeFormat.toDotted(track.info.duration) ?? messages.commands.play.undetermined);

                const embed = new Embed()
                    .setThumbnail(track.info.artworkUrl ?? undefined)
                    .setColor(client.config.color.success)
                    .setDescription(
                        messages.commands.play.embed.result({
                            duration: status,
                            requester: (track.requester as User).id,
                            position: player.queue.tracks.findIndex((t) => t.info.identifier === track.info.identifier) + 1,
                            title: track.info.title,
                            url: track.info.uri!,
                            volume: player.volume,
                        }),
                    )
                    .setTimestamp();

                await message
                    .reply({
                        flags: MessageFlags.SuppressNotifications,
                        content: "",
                        embeds: [embed],
                    })
                    .then(timeout);

                if (!player.playing) await player.play();
            }
            break;

        case "playlist":
            {
                const track = tracks[0];

                await player.queue.add(tracks, autoplayIndex);

                const embed = new Embed()
                    .setColor(client.config.color.success)
                    .setThumbnail(track.info.artworkUrl ?? undefined)
                    .setDescription(
                        messages.commands.play.embed.playlist({
                            query,
                            playlist: playlist?.name ?? playlist?.title ?? track.info.title,
                            requester: (track.requester as User).id,
                            tracks: tracks.length,
                            volume: player.volume,
                        }),
                    )
                    .setTimestamp();

                await message
                    .reply({
                        flags: MessageFlags.SuppressNotifications,
                        content: "",
                        embeds: [embed],
                    })
                    .then(timeout);

                if (!player.playing) await player.play();
            }
            break;

        default:
            {
                if (!player.queue.current) await player.destroy();

                await message
                    .reply({
                        flags: MessageFlags.SuppressNotifications,
                        content: "",
                        embeds: [
                            {
                                color: EmbedColors.Red,
                                description: messages.commands.play.noResults,
                            },
                        ],
                    })
                    .then(timeout);
            }
            break;
    }
}
