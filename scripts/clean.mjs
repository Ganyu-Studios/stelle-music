//@ts-check

import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";

console.info("Deleting files...");

try {
    const path = resolve("dist");
    const exists = existsSync(path);

    if (exists) rmSync(path, { recursive: true });

    console.info("Done! Cleared.");
} catch (error) {
    console.info(error);
    process.exit(1);
}
