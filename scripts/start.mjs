//@ts-check

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

/**
 * Checks if the dist folder exists and builds if necessary before starting the bot.
 * @type {() => Promise<void>}
 */
(async () => {
	const distPath = resolve("dist");
	const distExists = existsSync(distPath);

	if (!distExists) {
		console.error("\x1b[31m%s\x1b[0m", "Error: The 'dist' directory does not exist.");
		console.error(
			"\x1b[33m%s\x1b[0m",
			"The project needs to be built before it can be started.",
		);
		console.error("\x1b[36m%s\x1b[0m", "\nPlease run: pnpm build\n");
		console.error(
			"\x1b[90m%s\x1b[0m",
			"Or run 'pnpm clean' to build and clean in one step.",
		);
		process.exit(1);
	}

	// Start the bot
	const args = process.argv.slice(2);
	const child = spawn("node", ["./dist/index.js", ...args], {
		stdio: "inherit",
		shell: false,
	});

	child.on("exit", (code) => {
		process.exit(code ?? 0);
	});
})();
