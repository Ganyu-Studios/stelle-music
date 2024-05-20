export default {
    messages: {
        events: {
            inCooldown: ({ time }: ICooldown) => `\`❌\` You need to wait: <t:${time}:R> (<t:${time}:t>) to use this.`,
        },
    },
};

type ICooldown = { time: number };
