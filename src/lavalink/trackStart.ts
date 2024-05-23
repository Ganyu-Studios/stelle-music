import { Lavalink } from "#stelle/classes";

export default new Lavalink({
    name: "playerStart",
    type: "kazagumo",
    run: async (client, player, track) => {
        const channel = await client.channels.fetch(player.textId!);
        if (!channel.isTextGuild()) return;

        const voice = await client.channels.fetch(player.voiceId);
        if (!voice.isVoice()) return;

        await voice.setVoiceState(`🎵 ${track.title}`);
        await channel.messages.write({ content: `Now playing: ${track.title}` });
    },
});
