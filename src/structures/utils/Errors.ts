export class InvalidEnvironment extends Error {
    constructor(message: string) {
        super(message);
        this.name = "Stelle [InvalidEnvironment]";
    }
}

export class InvalidEmbedsLength extends Error {
    constructor(message: string) {
        super(message);
        this.name = "Stelle [InvalidEmbedsLength]";
    }
}

export class InvalidMessage extends Error {
    constructor(message: string) {
        super(message);
        this.name = "Stelle [InvalidMessage]";
    }
}

export class InvalidPageNumber extends Error {
    constructor(message: string) {
        super(message);
        this.name = "Stelle [InvalidPageNumber]";
    }
}
