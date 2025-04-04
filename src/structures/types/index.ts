export { StelleConfiguration, StelleEnvironment } from "./client/configuration.js";
export { StelleConstants, StelleDirectory } from "./client/constants.js";

/**
 * Construct a type with the properties of T except for those in type K.
 */
// Since the original one doesn't return the types that you want to exclude. So I added it
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
