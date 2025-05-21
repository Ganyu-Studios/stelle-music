//@ts-check

import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import { resolve } from "node:path";

/**
 * Deletes the dist folder if it exists.
 * @type {() => Promise<void>}
 */
(
    async () => {
        console.info("Deleting files...");

        try {
            const path = resolve("dist");
            const exists = existsSync(path);

            if (exists) await rm(path, { recursive: true });

            console.info("Done! Cleared.");
        } catch (error) {
            console.info(error);
            process.exit(1);
        }
    }
)();
