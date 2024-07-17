import { Lavalink } from "#stelle/classes";

import { type CommandContext, Embed } from "seyfert";

export default new Lavalink({
    name: "queueEnd",
    type: "manager",
    run: async (client, player) => {
        if (!(player.textChannelId && player.voiceChannelId)) return;

        const messageId = player.get<string | undefined>("messageId");
        if (!messageId) return;

        await client.messages.edit(messageId, player.textChannelId, { components: [] }).catch(() => null);

        const ctx = player.get<CommandContext | undefined>("commandContext");
        if (!ctx) return;

        const voice = await client.channels.fetch(player.voiceChannelId);
        if (!voice.isVoice()) return;

        const { messages } = await ctx.getLocale();

        const embed = new Embed().setDescription(messages.events.playerEnd).setColor(client.config.color.success).setTimestamp();

        await client.messages.write(player.textChannelId, { embeds: [embed] }).catch(() => null);
    },
});
