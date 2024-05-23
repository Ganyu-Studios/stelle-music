export default {
    messages: {
        commands: {
            ping: {
                message: "`🪶` Calculating...",
                response: ({ wsPing, clientPing }: IPing) => `\`🌐\` Pong! (**Client**: \`${wsPing}ms\` - **API**: \`${clientPing}ms\`)`,
            },
        },
        events: {
            inCooldown: ({ time }: ICooldown) => `\`❌\` You need to wait: <t:${time}:R> (<t:${time}:t>) to use this.`,
            onlyDeveloper: "`❌` Only the **bot developer** can use this.",
            onlyGuildOwner: "`❌` Only the **guild owner** can use this.",
            noVoiceChannel: "`❌` You are not in a **voice channel**... Join to play music.",
            noSameVoice: ({ channelId }: IChannel) => `\`❌\` You are not in the **same voice channel** as me. (<#${channelId}>)`,
        },
    },
    locales: {
        play: {
            name: "play",
            description: "Play music with Stelle.",
            option: {
                name: "query",
                description: "Enter the song name/url.",
            },
        },
        ping: {
            name: "ping",
            description: "Get the Stelle ping.",
        },
    },
};

type IChannel = { channelId: string };
type IPing = { wsPing: number; clientPing: number };
type ICooldown = { time: number };
