//@ts-check

import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
    schema: "prisma/schema.prisma",
    engine: "classic",
    datasource: {
        url: env("DATABASE_URL"),
    },
});
