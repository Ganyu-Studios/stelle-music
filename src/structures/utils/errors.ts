/**
 * The invalid environment error class.
 * This error is thrown when the environment variables are invalid.
 * @extends {Error}
 */
export class InvalidEnvironment extends Error {
    constructor(message: string) {
        super(message);
        this.name = "Stelle [InvalidEnvironment]";
    }
}
