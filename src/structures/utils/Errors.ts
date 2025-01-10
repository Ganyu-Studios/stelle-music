export class InvalidEnvironment extends Error {
    constructor(message: string) {
        super(message);
        this.name = "Stelle [InvalidEnvironment]";
    }
}

export class InvalidComponentRun extends Error {
    constructor(message: string) {
        super(message);
        this.name = "Stelle [InvalidComponentRun]";
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

export class InvalidSession extends Error {
    constructor(message: string) {
        super(message);
        this.name = "Stelle [InvalidSession]";
    }
}

export class InvalidWebhookUrl extends Error {
    constructor(message: string) {
        super(message);
        this.name = "Stelle [InvalidWebhookUrl]";
    }
}
