export default {
    messages: {
        events: {
            inCooldown: ({ time }: ICooldown) => `\`❌\` You need to wait: <t:${time}:R> (<t:${time}:t>) to use this.`,
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
    },
};

type ICooldown = { time: number };
