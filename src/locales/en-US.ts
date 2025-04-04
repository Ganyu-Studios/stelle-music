export default {
    messages: {
        events: {
            noCollector: ({ userId }: IUser) => `\`❌\` Only the user: <@${userId}> can use this.`,
        },
    },
};

type IUser = { userId: string };
