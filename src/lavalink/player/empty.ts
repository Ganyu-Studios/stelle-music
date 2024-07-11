import { PlayerState } from "kazagumo";
import { Lavalink } from "#stelle/classes";
import { autoplay } from "#stelle/utils/functions/autoplay.js";

import { type CommandContext, Embed } from "seyfert";

export default new Lavalink({
    name: "playerEmpty",
    type: "kazagumo",
    run: async (client, player) => {
        if (!player.textId) return;

        if (typeof player.textId !== "string" || typeof player.voiceId !== "string") return;
        if (player.state !== PlayerState.CONNECTED) return;

        const messageId = player.data.get("messageId") as string | undefined;
        if (!messageId) return;

        await client.messages.edit(messageId, player.textId, { components: [] }).catch(() => null);

        if (player.data.get("enabledAutoplay")) return autoplay(player, player.getPrevious(true));

        const ctx = player.data.get("commandContext") as CommandContext | undefined;
        if (!ctx) return;

        const voice = await client.channels.fetch(player.voiceId);
        if (!voice.isVoice()) return;

        const { messages } = await ctx.getLocale();

        const embed = new Embed().setDescription(messages.events.playerEnd).setColor(client.config.color.success).setTimestamp();

        await client.messages.write(player.textId, { embeds: [embed] }).catch(() => null);
    },
});
