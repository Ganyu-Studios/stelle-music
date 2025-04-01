const { TOKEN, DATABASE_URL, ERRORS_WEBHOOK, REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } = process.env;

export const Configuration = {
    color: {
        success: 0x8d86a8,
        extra: 0xece8f1,
    },
};

export const Environment = {
    Token: TOKEN,
    DatabaseURL: DATABASE_URL,
    ErrorsWebhook: ERRORS_WEBHOOK,
    RedisHost: REDIS_HOST,
    RedisPort: REDIS_PORT,
    RedisPassword: REDIS_PASSWORD,
};
