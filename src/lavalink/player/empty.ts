import { Lavalink } from "#stelle/classes";
import { Embed } from "seyfert";

export default new Lavalink({
    name: "queueEnd",
    type: "manager",
    run: async (client, player) => {
        if (!(player.textChannelId && player.voiceChannelId)) {
            return;
        }

        const messageId = player.get<undefined | string>("messageId");
        if (!messageId) {
            return;
        }

        await client.messages.edit(messageId, player.textChannelId, { components: [] }).catch(() => null);

        const locale = player.get<undefined | string>("localeString");
        if (!locale) {
            return;
        }

        const voice = await client.channels.fetch(player.voiceChannelId);
        if (!voice.is(["GuildStageVoice", "GuildVoice"])) {
            return;
        }

        const { messages } = client.t(locale).get();

        if (voice.is(["GuildVoice"])) {
            await voice.setVoiceStatus(messages.events.voiceStatus.queueEnd).catch(() => null);
        }

        const embed = new Embed().setDescription(messages.events.playerEnd).setColor(client.config.color.success).setTimestamp();

        await client.messages.write(player.textChannelId, { embeds: [embed] }).catch(() => null);
    }
});
