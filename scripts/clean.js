//@ts-check

import { exec } from "node:child_process";
import { rm } from "node:fs/promises";
import { promisify } from "node:util";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

import chalk from "chalk";

const execSync = promisify(exec);

(async () => {
    console.info("Attemping to compile...");

    const timeStart = Date.now();

    try {
        const path = resolve("dist");
        const exist = existsSync(path);

        if (exist) await rm(path, { recursive: true });

        await execSync("pnpm build");

        console.info(`Done! Compiled at: ${Date.now() - timeStart}ms`);
    } catch (error) {
        console.info("Error! Compilation error!\n")
        console.info(chalk.red(error.stdout));
        process.exit(1);
    };
})();