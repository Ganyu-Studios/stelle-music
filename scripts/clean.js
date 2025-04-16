//@ts-check

import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import { resolve } from "node:path";

(async () => {
    console.info("Deleting files...");

    try {
        const path = resolve("dist");
        if (existsSync(path)) await rm(path, { recursive: true });
        console.info("Done! Cleared.");
    } catch (error) {
        console.info(error);
        process.exit(1);
    }
})();
