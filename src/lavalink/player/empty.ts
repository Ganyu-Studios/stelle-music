import { Lavalink } from "#stelle/classes";
import { autoplay } from "#stelle/utils/functions/autoplay.js";

import { type CommandContext, Embed } from "seyfert";

export default new Lavalink({
    name: "playerEmpty",
    type: "kazagumo",
    run: async (client, player) => {
        if (!player.textId) return;

        const messageId = player.data.get("messageId") as string | undefined;
        if (!messageId) return;

        await client.messages.edit(messageId, player.textId, { components: [] });

        if (player.data.get("autoplay")) return autoplay(player, player.getPrevious(true));

        const ctx = player.data.get("commandContext") as CommandContext | undefined;
        if (!ctx) return;

        const channel = await client.channels.fetch(player.textId);
        if (!channel.isTextGuild()) return;

        const voice = await client.channels.fetch(player.voiceId);
        if (!voice.isVoice()) return;

        const { messages } = ctx.t.get(await ctx.getLocale());

        const embed = new Embed().setDescription(messages.events.playerEnd).setColor(client.config.color.success).setTimestamp();

        await voice.setVoiceState(null);
        await channel.messages.write({ embeds: [embed] });
    },
});
