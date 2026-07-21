import type { PlayerStructure } from "hoshimi";
import type { AllChannels, GuildMember, UsingClient, VoiceState } from "seyfert";
import { EmbedColors } from "seyfert/lib/common/index.js";
import { TimeFormat } from "#stelle/utils/functions/internal/time.js";

const timeouts: Map<string, NodeJS.Timeout> = new Map();

/**
 *
 * The listener for the `voiceStateUpdate` event of the client.
 * This event is emitted when a voice state is updated.
 * @param {UsingClient} client The client instance.
 * @param {VoiceState} newState The new voice state.
 * @param {VoiceState} [oldState] The old voice state.
 * @returns {Promise<void>} Did you know, Ganyu is the best waifu?
 */
export async function playerListener(client: UsingClient, newState: VoiceState, oldState?: VoiceState): Promise<void> {
    if (oldState?.channelId === newState.channelId) return;

    const { guildId } = newState;

    const player: PlayerStructure | undefined = client.manager.getPlayer(guildId);
    if (!player) return;

    if (!(player.textId && player.voiceId)) return;

    const locale: string | undefined = await player.data.get("localeString");
    if (!locale) return;

    const { messages } = client.t(locale).get();

    const channel: AllChannels = await client.channels.fetch(player.voiceId);
    if (!channel.is(["GuildStageVoice", "GuildVoice"])) return;

    const members: GuildMember[] = await Promise.all(channel.states().map((c): Promise<GuildMember> => c.member()));
    const isEmpty: boolean = !members.filter(({ user }): boolean => !user.bot).length;

    const isChannel: boolean = oldState?.channelId === player.voiceId && newState.channelId !== oldState?.channelId;

    const is247: boolean = (await player.data.get("is247")) || client.config.twentyfourseven.is247;
    const isAutoPause: boolean = (await player.data.get("isAutoPause")) ?? client.config.twentyfourseven.autoPause;

    if (is247) {
        if (isAutoPause) {
            if (isEmpty && (player.paused || player.playing)) await player.setPaused(true);
            else if (!isEmpty && player.paused) await player.setPaused(false);
        }

        if (isEmpty && isChannel) {
            await client.messages.write(player.textId, {
                embeds: [
                    {
                        color: client.config.color.success,
                        description: messages.events.is247Enabled,
                    },
                ],
            });
        }

        return;
    }

    if (
        isChannel &&
        isEmpty &&
        !player.playing &&
        !player.paused &&
        !(player.queue.tracks.length + Number(!!player.queue.current)) &&
        player.connected
    ) {
        await player.destroy();
        await client.messages.write(player.textId, {
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

    if (isChannel && isEmpty && !player.playing && player.paused && player.queue.current && !player.queue.tracks.length) {
        await player.destroy();
        await client.messages.write(player.textId, {
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

    if (isChannel && isEmpty && (player.paused || player.playing)) {
        await player.setPaused(true);
        await client.messages.write(player.textId, {
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

        const timeoutId: NodeJS.Timeout = setTimeout(async (): Promise<void> => {
            await player.destroy();
            await client.messages.write(player.textId!, {
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
        await player.setPaused(false);
        await client.messages.write(player.textId, {
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
