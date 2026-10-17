import "dotenv/config";

import { Structures } from "hoshimi";
import { HoshimiLyricsManager } from "#stelle/classes/manager/LyricsManager.js";
import { Configuration } from "#stelle/utils/data/configuration.js";
import { LoggerOps } from "#stelle/utils/functions/internal/logger.js";

// The configuration now is dynamically loaded, so we need to call it first.
await Configuration.load();

import { Logger } from "seyfert";
import { Stelle } from "#stelle/classes/client/Stelle.js";
import { ms } from "#stelle/utils/functions/internal/time.js";
import { UtilsOps } from "#stelle/utils/functions/internal/utils.js";

/**
 * How long a graceful shutdown may take before the process is forced to exit (e.g. an unreachable database).
 * @type {number}
 */
const SHUTDOWN_TIMEOUT: number = ms("10s");

// Override the default LyricsManager with our custom implementation.
Structures.LyricsManager = (...args) => new HoshimiLyricsManager(...args);

Logger.customize(LoggerOps.custom);
Logger.saveOnFile = "all";
Logger.dirname = "logs";

const client = new Stelle();

/**
 * Whether a shutdown is already in progress, so a repeated signal (e.g. a double Ctrl+C) doesn't run it twice.
 * @type {boolean}
 */
let shuttingDown: boolean = false;

/**
 * Gracefully shut down on a termination signal: close the gateway, the database and Redis, then exit. A watchdog forces
 * the exit if the cleanup hangs, so the process can never get stuck on its way down.
 * @param {NodeJS.Signals} signal The received signal.
 * @returns {Promise<void>} A promise that resolves right away for a repeated signal; otherwise the process exits.
 */
async function shutdown(signal: NodeJS.Signals): Promise<void> {
    if (shuttingDown) return;

    shuttingDown = true;

    setTimeout((): never => process.exit(1), SHUTDOWN_TIMEOUT).unref();

    client.logger.warn(`[Client] Received ${signal}`);

    try {
        await client.shutdown();
        process.exit(0);
    } catch (error) {
        client.logger.error(`[Client] Shutdown failed | error: ${UtilsOps.inspect(error)}`);
        process.exit(1);
    }
}

// Registered before starting, so a signal that arrives mid-startup is cleaned up too.
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// "Warning: Detected unsettled top-level await" my ass
(async (): Promise<void> => await client.run())();
