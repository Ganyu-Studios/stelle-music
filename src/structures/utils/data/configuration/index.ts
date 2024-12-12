import type { StelleConfiguration } from "#stelle/types";
import { DevConfiguration } from "./development.js";
import { ProductionConfiguration } from "./production.js";

/**
 * Stelle configuration.
 */
export const Configuration: StelleConfiguration = process.argv[2] === "prod" ? DevConfiguration : ProductionConfiguration;
