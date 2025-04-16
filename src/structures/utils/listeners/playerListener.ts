import type { UsingClient, VoiceState } from "seyfert";
import { EmbedColors } from "seyfert/lib/common/index.js";

import { TimeFormat } from "#stelle/utils/functions/time.js";

const timeouts: Map<string, NodeJS.Timeout> = new Map();

/**
 *
 * The player voice state listener.
 * @param client The client instance.
 * @param newState The new voice state.
 * @param oldState The old voice state.
 * @returns {Promise<void>}
 */
export async function playerListener(client: UsingClient, newState: VoiceState, oldState?: VoiceState): Promise<void> {
    if (oldState?.channelId === newState.channelId) return;

    const { guildId } = newState;

    const player = client.manager.getPlayer(guildId);
    if (!player) return;

    if (!(player.textChannelId && player.voiceChannelId)) return;

    const locale = player.get<string | undefined>("localeString");
    if (!locale) return;

    const { messages } = client.t(locale).get();

    const channel = await client.channels.fetch(player.voiceChannelId);
    if (!channel.is(["GuildStageVoice", "GuildVoice"])) return;

    const members = await Promise.all(channel.states().map((c) => c.member()));
    const isEmpty = members.filter(({ user }) => !user.bot).length === 0;

    if (
        isEmpty &&
        !player.playing &&
        !player.paused &&
        !(player.queue.tracks.length + Number(!!player.queue.current)) &&
        player.connected
    ) {
        await player.destroy();
        await client.messages.write(player.textChannelId!, {
            embeds: [
                {
                    color: EmbedColors.Yellow,
                    description: messages.events.noMembers({
                        clientName: client.me.username,
                    }),
                },
            ],
        });

        return;
    }

    if (isEmpty && !player.playing && player.paused && player.queue.current && !player.queue.tracks.length) {
        await player.destroy();
        await client.messages.write(player.textChannelId!, {
            embeds: [
                {
                    color: EmbedColors.Yellow,
                    description: messages.events.noMembers({
                        clientName: client.me.username,
                    }),
                },
            ],
        });

        return;
    }

    if (isEmpty && (player.paused || player.playing)) {
        await player.pause();
        await client.messages.write(player.textChannelId, {
            embeds: [
                {
                    color: EmbedColors.Yellow,
                    description: messages.events.channelEmpty({
                        type: TimeFormat.toHumanize(client.config.disconnectTime),
                        clientName: client.me.username,
                    }),
                },
            ],
        });

        const timeoutId = setTimeout(async () => {
            await player.destroy();
            await client.messages.write(player.textChannelId!, {
                embeds: [
                    {
                        color: EmbedColors.Yellow,
                        description: messages.events.noMembers({
                            clientName: client.me.username,
                        }),
                    },
                ],
            });
        }, client.config.disconnectTime);

        timeouts.set(guildId, timeoutId);
    } else if (timeouts.has(guildId) && !isEmpty && player.paused) {
        await player.resume();
        await client.messages.write(player.textChannelId, {
            embeds: [
                {
                    color: EmbedColors.Yellow,
                    description: messages.events.hasMembers({
                        clientName: client.me.username,
                    }),
                },
            ],
        });

        clearTimeout(timeouts.get(guildId));
        timeouts.delete(guildId);
    }
}
