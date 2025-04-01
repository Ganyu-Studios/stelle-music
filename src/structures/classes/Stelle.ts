import { Client } from "seyfert";

/**
 * Class representing the main client of the bot.
 * @extends Client
 * @class Stelle
 */
export class Stelle extends Client<true> {
    /**
     * The timestamp when the client is ready.
     * @type {number}
     * @default 0
     * @readonly
     */
    public readyTimestamp: number = 0;

    /**
     * Start the main process of the client.
     * @returns {Promise<void>} A epic promise, yay!
     */
    public async run(): Promise<void> {
        await this.start();
    }
}
