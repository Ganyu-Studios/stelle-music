import { defineConfig, env } from "prisma/config";

// Load `.env` explicitly instead of relying on the runtime: depending on how the Prisma CLI is launched (e.g. by
// `bunx --bun` on Linux, or by plain Node), the process may not auto-load it, and `env()` then throws as if the
// variable were missing. Variables already set win (it never overrides), and a missing file is fine: Docker passes
// `DATABASE_URL` through the environment instead.
try {
    process.loadEnvFile();
} catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
}

export default defineConfig({
    schema: "prisma/schema.prisma",
    engine: "classic",
    datasource: {
        url: env("DATABASE_URL"),
    },
});
