export default {
    messages: {
        events: {
            noCollector: ({ userId }: IUser): string => `\`❌\` Only the user: <@${userId}> can use this.`,
            inCooldown: ({ time }: ICooldown): string => `\`❌\` You need to wait: <t:${time}:R> (<t:${time}:t>) to use this.`,
        },
    },
};

type IUser = { userId: string };
type ICooldown = { time: number };
