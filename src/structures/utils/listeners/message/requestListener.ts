import { Embed, type Message, type MessageStructure, type User, type UsingClient } from "seyfert";
import { EmbedColors } from "seyfert/lib/common/index.js";
import { MessageFlags } from "seyfert/lib/types/index.js";

import { TimeFormat } from "#stelle/utils/functions/time.js";
import { omitKeys } from "#stelle/utils/functions/utils.js";

/**
 *
 * The listener for the `messageCreate` event of the client.
 * This event is emitted when a message is created in the request text channel.
 * @param {UsingClient} client The client instance.
 * @param {Message} message The message instance.
 * @returns {Promise<void>} Ganyu is the most cute character in the world.
 */
export async function requestListener(client: UsingClient, message: Message): Promise<MessageStructure | void> {
    const { guildId, member } = message;

    if (!(guildId && member)) return;

    const requestId = await client.database.getRequest(guildId);
    if (requestId && message.channelId !== requestId) return;

    const { messages } = client.t(await client.database.getLocale(guildId)).get();

    const state = await member.voice().catch(() => null);
    if (!state)
        return message.reply({
            content: "",
            flags: MessageFlags.SuppressNotifications,
            embeds: [
                {
                    description: messages.events.noVoiceChannel,
                    color: EmbedColors.Red,
                },
            ],
        });

    const voice = await state.channel();
    if (!voice)
        return message.reply({
            content: "",
            flags: MessageFlags.SuppressNotifications,
            embeds: [
                {
                    description: messages.events.noVoiceChannel,
                    color: EmbedColors.Red,
                },
            ],
        });

    const me = await client.members.fetch(guildId, client.me.id);
    const localeString = await client.database.getLocale(guildId);

    let bot = await me.voice().catch(() => null);
    if (bot && bot.channelId !== voice.id)
        return message.reply({
            content: "",
            flags: MessageFlags.SuppressNotifications,
            embeds: [
                {
                    description: messages.events.noSameVoice({ channelId: bot.channelId! }),
                    color: EmbedColors.Red,
                },
            ],
        });

    const { defaultVolume, searchPlatform } = await client.database.getPlayer(guildId);

    const query = message.content.trim();
    if (!query.length)
        return message.reply({
            content: "",
            flags: MessageFlags.SuppressNotifications,
            embeds: [
                {
                    description: messages.events.noQuery,
                    color: EmbedColors.Red,
                },
            ],
        });
    const player = client.manager.createPlayer({
        guildId,
        voiceChannelId: voice.id,
        volume: defaultVolume,
        textChannelId: message.channelId,
        selfDeaf: true,
        selfMute: false,
    });

    const { loadType, playlist, tracks } = await player.search({ query, source: searchPlatform }, message.author);

    if (!player.get("localeString")) player.set("localeString", localeString);
    if (!player.get("me")) player.set("me", omitKeys(client.me, ["client"]));

    const autoplayIndex = player.get("enabledAutoplay") ? 0 : undefined;

    if (!bot) bot = await me.voice().catch(() => null);
    if (voice.isStage() && bot?.suppress) await bot.setSuppress(false);

    switch (loadType) {
        case "empty":
        case "error":
            {
                if (!player.queue.current) await player.destroy();

                await message.reply({
                    flags: MessageFlags.SuppressNotifications,
                    content: "",
                    embeds: [
                        {
                            color: EmbedColors.Red,
                            description: messages.commands.play.noResults,
                        },
                    ],
                });
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

                await message.reply({
                    content: "",
                    embeds: [embed],
                });

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

                await message.reply({
                    content: "",
                    embeds: [embed],
                });

                if (!player.playing) await player.play();
            }
            break;

        default:
            {
                if (!player.queue.current) await player.destroy();

                await message.reply({
                    content: "",
                    embeds: [
                        {
                            color: EmbedColors.Red,
                            description: messages.commands.play.noResults,
                        },
                    ],
                });
            }
            break;
    }
}
