import { type CommandContext, createEvent } from "seyfert";
import { EmbedColors } from "seyfert/lib/common/index.js";

import { msParser } from "#stelle/utils/functions/utils.js";

const timeouts: Map<string, NodeJS.Timeout> = new Map();

export default createEvent({
    data: { name: "voiceStateUpdate" },
    run: async ([newState], client) => {
        const { guildId } = newState;

        const player = client.manager.getPlayer(guildId);
        if (!player?.textId) return;

        const ctx = player.data.get("commandContext") as CommandContext | undefined;
        const is24 = !!player.data.get("enabled24");

        if (!ctx) return;

        const { messages } = ctx.t.get(await ctx.getLocale());

        const channel = await client.channels.fetch(player.voiceId);
        if (!channel.isVoice()) return;

        const members = await Promise.all((await channel.states()).map(async (c) => await c.member()));
        const isEmpty = members.filter(({ user }) => !user.bot).length === 0;

        if (isEmpty && !is24) {
            player.pause(true);

            await client.messages.write(player.textId, {
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
                await client.messages.write(player.textId, {
                    embeds: [
                        {
                            description: messages.events.noMembers,
                            color: EmbedColors.Yellow,
                        },
                    ],
                });
            }, client.config.disconnectTime);

            timeouts.set(guildId, timeoutId);
        } else if (timeouts.has(guildId) && player.paused && !isEmpty) {
            clearTimeout(timeouts.get(guildId));
            player.pause(false);

            await client.messages.write(player.textId, {
                embeds: [
                    {
                        description: messages.events.hasMembers,
                        color: EmbedColors.Yellow,
                    },
                ],
            });
        }
    },
});
