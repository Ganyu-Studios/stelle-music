/**
 * Error thrown when an invalid environment value is provided.
 * @class InvalidEnvValue
 * @extends {Error}
 */
export class InvalidEnvValue extends Error {
    override name: string = "Stelle [InvalidEnvValue]";
}

/**
 * Error thrown when an invalid component run is provided.
 * @class InvalidComponentRun
 * @extends {Error}
 */
export class InvalidComponentRun extends Error {
    override name: string = "Stelle [InvalidComponentRun]";
}

/**
 * Error thrown when an invalid component type is provided.
 * @class InvalidComponentType
 * @extends {Error}
 */
export class InvalidEmbedsLength extends Error {
    override name: string = "Stelle [InvalidEmbedsLength]";
}

/**
 * Error thrown when an invalid component type is provided.
 * @class InvalidComponentType
 * @extends {Error}
 */
export class InvalidMessage extends Error {
    override name: string = "Stelle [InvalidMessage]";
}

/**
 * Error thrown when an invalid component type is provided.
 * @class InvalidComponentType
 * @extends {Error}
 */
export class InvalidPageNumber extends Error {
    override name: string = "Stelle [InvalidPageNumber]";
}

/**
 * Error thrown when the nodes has a session id, but the session id is resolved.
 * @class InvalidNodeSession
 * @extends {Error}
 */
export class InvalidNodeSession extends Error {
    override name: string = "Stelle [InvalidSession]";
}

/**
 * Error thrown when an invalid component is provided.
 * @class InvalidRow
 * @extends {Error}
 */
export class InvalidRow extends Error {
    override name: string = "Stelle [InvalidRow]";
}

/**
 * Error thrown when an invalid component type is provided.
 * @class InvalidComponentType
 * @extends {Error}
 */
export class InvalidComponentType extends Error {
    override name: string = "Stelle [InvalidComponentType]";
}

/**
 * Error thrown when an invalid queue store is provided.
 * @class InvalidQueue
 * @extends {Error}
 */
export class InvalidQueue extends Error {
    override name: string = "Stelle [InvalidQueue]";
}

/**
 * Error thrown when an invalid configuration is provided.
 * @class InvalidConfiguration
 * @extends {Error}
 */
export class InvalidConfiguration extends Error {
    override name: string = "Stelle [InvalidConfiguration]";
}

/**
 * Error thrown when an invalid webhook URL is provided.
 * @class InvalidWebhookURL
 * @extends {Error}
 */
export class InvalidWebhookURL extends Error {
    override name: string = "Stelle [InvalidWebhookURL]";
}
