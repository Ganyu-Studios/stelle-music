/**
 * Error thrown when an invalid environment value is provided.
 * @class InvalidEnvValue
 * @extends {Error}
 */
export class InvalidEnvValue extends Error {
    constructor(message: string) {
        super(message);
        this.name = "Stelle [InvalidEnvValue]";
    }
}

/**
 * Error thrown when an invalid component run is provided.
 * @class InvalidComponentRun
 * @extends {Error}
 */
export class InvalidComponentRun extends Error {
    constructor(message: string) {
        super(message);
        this.name = "Stelle [InvalidComponentRun]";
    }
}

/**
 * Error thrown when an invalid component type is provided.
 * @class InvalidComponentType
 * @extends {Error}
 */
export class InvalidEmbedsLength extends Error {
    constructor(message: string) {
        super(message);
        this.name = "Stelle [InvalidEmbedsLength]";
    }
}

/**
 * Error thrown when an invalid component type is provided.
 * @class InvalidComponentType
 * @extends {Error}
 */
export class InvalidMessage extends Error {
    constructor(message: string) {
        super(message);
        this.name = "Stelle [InvalidMessage]";
    }
}

/**
 * Error thrown when an invalid component type is provided.
 * @class InvalidComponentType
 * @extends {Error}
 */
export class InvalidPageNumber extends Error {
    constructor(message: string) {
        super(message);
        this.name = "Stelle [InvalidPageNumber]";
    }
}

/**
 * Error thrown when the nodes has a session id, but the session id is resolved.
 * @class InvalidNodeSession
 * @extends {Error}
 */
export class InvalidNodeSession extends Error {
    constructor(message: string) {
        super(message);
        this.name = "Stelle [InvalidSession]";
    }
}

/**
 * Error thrown when an invalid component is provided.
 * @class InvalidRow
 * @extends {Error}
 */
export class InvalidRow extends Error {
    constructor(message: string) {
        super(message);
        this.name = "Stelle [InvalidRow]";
    }
}

/**
 * Error thrown when an invalid component type is provided.
 * @class InvalidComponentType
 * @extends {Error}
 */
export class InvalidComponentType extends Error {
    constructor(message: string) {
        super(message);
        this.name = "Stelle [InvalidComponentType]";
    }
}
