import type { CommandContext, UsingClient, VoiceState } from "seyfert";
import { EmbedColors } from "seyfert/lib/common/index.js";

import { msParser } from "#stelle/utils/functions/utils.js";

const timeouts: Map<string, NodeJS.Timeout> = new Map();

export async function playerListener(client: UsingClient, newState: VoiceState, oldState?: VoiceState): Promise<void> {
    if (oldState?.channelId === newState.channelId) return;

    const { guildId } = newState;

    const player = client.manager.getPlayer(guildId);
    if (!player) return;

    if (!(player.textChannelId && player.voiceChannelId)) return;

    const ctx = player.get<CommandContext | undefined>("commandContext");
    if (!ctx) return;

    const { messages } = await ctx.getLocale();

    const channel = await client.channels.fetch(player.voiceChannelId);
    if (!channel.isVoice()) return;

    const members = await Promise.all((await channel.states()).map(async (c) => await c.member()));
    const isEmpty = members.filter(({ user }) => !user.bot).length === 0;

    if (isEmpty && (player.playing || player.paused)) {
        if (!player.paused && player.playing) player.pause();

        await client.messages.write(player.textChannelId, {
            embeds: [
                {
                    color: EmbedColors.Yellow,
                    description: messages.events.channelEmpty({
                        type: msParser(client.config.disconnectTime),
                    }),
                },
            ],
        });

        const timeoutId = setTimeout(async () => {
            await player.destroy();
            await client.messages.write(player.textChannelId!, {
                embeds: [
                    {
                        description: messages.events.noMembers,
                        color: EmbedColors.Yellow,
                    },
                ],
            });
        }, client.config.disconnectTime);

        timeouts.set(guildId, timeoutId);
    } else if (timeouts.has(guildId) && !isEmpty && !player.playing && player.paused) {
        if (!player.playing && player.paused) player.resume();

        clearTimeout(timeouts.get(guildId));

        await client.messages.write(player.textChannelId, {
            embeds: [
                {
                    description: messages.events.hasMembers,
                    color: EmbedColors.Yellow,
                },
            ],
        });

        timeouts.delete(guildId);
    }
}
