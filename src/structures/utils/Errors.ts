export class InvalidEnvironment extends Error {
    constructor(message: string) {
        super(message);
        this.name = "Stelle [InvalidEnvironment]";
    }
}
